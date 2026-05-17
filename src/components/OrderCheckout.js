import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isLoggedIn } from '../utils/cookie';
import { getAccessToken } from '../utils/token';
import { getDeliveryAddresses, createDeliveryAddress, fetchUserCoupons, createServerOrder, prepareCartIdsForCheckout } from '../utils/api';
import { processPayment } from '../utils/payment';
import { getReceivedCoupons, checkCouponExpiry, applyCoupon } from '../utils/coupon';
import { saveDeliveryAddress } from '../utils/delivery';
import { orderLineTotal, orderSubtotalFromItems, shippingFeeForSubtotal } from '../utils/pricing';
import { formatKoreanMobilePhone, isValidKoreanMobilePhone } from '../utils/phoneFormat';
import './OrderCheckout.css';

function OrderCheckout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderItems, setOrderItems] = useState([]);
  const [fromCart, setFromCart] = useState(false);
  const [cartIds, setCartIds] = useState([]);
  const [deliveryAddresses, setDeliveryAddresses] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [showDeliveryAddressModal, setShowDeliveryAddressModal] = useState(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    postcode: '',
    address: '',
    detailAddress: '',
    recipient: '',
    phoneNumber: '',
    isDefault: false
  });
  const setNewAddressFormRef = useRef(null);
  /** 쿠폰 목록 비동기 로드가 겹칠 때, 오래된 요청(subtotal=0 등)이 나중에 끝나 빈 목록을 덮어쓰지 않도록 함 */
  const couponLoadSeqRef = useRef(0);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [showCouponModal, setShowCouponModal] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    if (!getAccessToken()) {
      window.alert(
        '주문·결제는 auth-service 로그인(JWT)이 필요합니다. 테스트 계정(test 등)으로 쿠키만 로그인된 경우 토큰이 없어 주문을 만들 수 없습니다. 로그아웃 후 회원 이메일로 다시 로그인해 주세요.'
      );
      navigate('/login', { replace: true });
      return;
    }

    const state = location.state;
    if (!state) {
      setOrderItems([]);
      setLoading(false);
      return;
    }

    if (state.from === 'cart' && state.items && state.items.length > 0) {
      setFromCart(true);
      setCartIds(state.cartIds || state.items.map(i => i.cartId || i.id).filter(Boolean));
      setOrderItems(state.items.map(item => ({
        productId: item.productId,
        name: item.name || item.productName,
        price: item.price || item.productPrice || 0,
        productDiscount: item.productDiscount != null ? item.productDiscount : 0,
        image: item.image || item.productImage,
        quantity: item.quantity || 1,
        cartId: item.cartId || item.id
      })));
    } else if (state.from === 'product' && state.product) {
      setFromCart(false);
      const p = state.product;
      const qty = state.quantity || 1;
      setOrderItems([{
        productId: p.id,
        name: p.name,
        price: p.price || p.originalPrice,
        productDiscount: p.discount != null ? p.discount : 0,
        image: p.image,
        quantity: qty,
        cartId: null
      }]);
    } else {
      setOrderItems([]);
    }

    setLoading(false);
  }, [location.state, navigate]);

  useEffect(() => {
    setNewAddressFormRef.current = setNewAddressForm;
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) return;
    loadDeliveryAddresses();
  }, []);

  const loadDeliveryAddresses = async () => {
    setLoadingAddresses(true);
    const res = await getDeliveryAddresses();
    if (res.success && res.data && res.data.length > 0) {
      setDeliveryAddresses(res.data);
      const defaultAddr = res.data.find(a => a.isDefault) || res.data[0];
      setDeliveryAddress({
        postcode: defaultAddr.postcode,
        address: defaultAddr.address,
        detailAddress: defaultAddr.detailAddress || '',
        recipient: defaultAddr.recipient,
        phone: defaultAddr.phoneNumber
      });
    }
    setLoadingAddresses(false);
  };

  const loadAvailableCoupons = async () => {
    const seq = ++couponLoadSeqRef.current;
    checkCouponExpiry();
    const subtotal = orderSubtotalFromItems(orderItems);
    const localCoupons = getReceivedCoupons();
    const apiRes = await fetchUserCoupons();
    if (seq !== couponLoadSeqRef.current) return;
    const fromApi = apiRes.success ? (apiRes.data || []) : [];
    const merged = [...fromApi, ...localCoupons];
    const usableCoupons = merged.filter(coupon => {
      if (coupon.status !== 'received') return false;
      if (coupon.validUntil) {
        const validUntil = new Date(coupon.validUntil);
        if (!Number.isNaN(validUntil.getTime()) && validUntil < new Date()) return false;
      }
      if (coupon.minPurchase && subtotal < coupon.minPurchase) return false;
      return true;
    });
    if (seq !== couponLoadSeqRef.current) return;
    setAvailableCoupons(usableCoupons);
  };

  useEffect(() => {
    if (!isLoggedIn()) return;
    if (orderItems.length === 0) {
      setAvailableCoupons([]);
      return;
    }
    loadAvailableCoupons();
  }, [orderItems]);

  const handleAddressSet = () => {
    setShowDeliveryAddressModal(true);
    loadDeliveryAddresses();
  };

  const handleChangeAddress = () => {
    setShowDeliveryAddressModal(true);
    loadDeliveryAddresses();
  };

  const handleSelectDeliveryAddress = (address) => {
    setDeliveryAddress({
      postcode: address.postcode,
      address: address.address,
      detailAddress: address.detailAddress || '',
      recipient: address.recipient,
      phone: address.phoneNumber
    });
    saveDeliveryAddress({
      postcode: address.postcode,
      address: address.address,
      detailAddress: address.detailAddress || '',
      recipient: address.recipient,
      phone: address.phoneNumber
    });
    setShowDeliveryAddressModal(false);
  };

  const handleOpenAddAddressModal = () => {
    setNewAddressForm({
      postcode: '',
      address: '',
      detailAddress: '',
      recipient: '',
      phoneNumber: '',
      isDefault: false
    });
    setShowAddAddressModal(true);
    setShowDeliveryAddressModal(false);
  };

  const handleSearchAddress = () => {
    if (!window.daum || !window.daum.Postcode) {
      window.alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    new window.daum.Postcode({
      oncomplete: function(data) {
        const fullAddress = data.address;
        let extraAddress = '';

        if(data.bname !== '' && /[동|로|가]$/g.test(data.bname)){
          extraAddress += data.bname;
        }
        if(data.buildingName !== '' && data.buildingName !== 'N'){
          extraAddress += (extraAddress !== '' ? ', ' + data.buildingName : data.buildingName);
        }
        if(extraAddress !== ''){
          extraAddress = ' (' + extraAddress + ')';
        }

        const setter = setNewAddressFormRef.current;
        if (setter) {
          setter(prev => ({
            ...prev,
            postcode: data.zonecode,
            address: `${fullAddress}${extraAddress}`.trim()
          }));
        }
      },
      width: '100%',
      height: '100%'
    }).open();
  };

  const handleSaveNewAddress = async () => {
    if (!newAddressForm.postcode || !newAddressForm.address || 
        !newAddressForm.recipient || !newAddressForm.phoneNumber) {
      window.alert('필수 항목을 모두 입력해주세요.');
      return;
    }
    if (!isValidKoreanMobilePhone(newAddressForm.phoneNumber)) {
      window.alert('전화번호는 010-1234-5678 형식(11자리)으로 입력해주세요.');
      return;
    }

    const result = await createDeliveryAddress({
      postcode: newAddressForm.postcode,
      address: newAddressForm.address,
      detailAddress: newAddressForm.detailAddress,
      recipient: newAddressForm.recipient,
      phoneNumber: newAddressForm.phoneNumber,
      isDefault: newAddressForm.isDefault
    });

    if (result.success) {
      const newAddr = {
        postcode: newAddressForm.postcode,
        address: newAddressForm.address,
        detailAddress: newAddressForm.detailAddress || '',
        recipient: newAddressForm.recipient,
        phone: newAddressForm.phoneNumber
      };
      setDeliveryAddress(newAddr);
      saveDeliveryAddress(newAddr);
      window.alert('배송지가 저장되었습니다.');
      setShowAddAddressModal(false);
      await loadDeliveryAddresses();
    } else {
      window.alert(result.message || '배송지 저장에 실패했습니다.');
    }
  };

  const subtotal = orderSubtotalFromItems(orderItems);
  let discountAmount = 0;
  if (selectedCoupon) {
    if (selectedCoupon.discountType === 'fixed') {
      discountAmount = selectedCoupon.discount;
    } else {
      discountAmount = Math.floor(subtotal * (selectedCoupon.discount / 100));
    }
  }
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const shipping = shippingFeeForSubtotal(afterDiscount);
  const total = afterDiscount + shipping;

  const handlePayment = async () => {
    if (orderItems.length === 0) {
      window.alert('주문할 상품이 없습니다.');
      return;
    }
    if (!deliveryAddress) {
      window.alert('배송지를 선택해주세요.');
      return;
    }
    if (!getAccessToken()) {
      window.alert('로그인 토큰이 없습니다. 다시 로그인해 주세요.');
      navigate('/login', { replace: true });
      return;
    }

    setPaying(true);
    const orderName = orderItems.length > 1
      ? `${orderItems[0].name} 외 ${orderItems.length - 1}종`
      : orderItems[0].name;

    try {
      const cartPrep = await prepareCartIdsForCheckout(orderItems, fromCart, cartIds);
      if (!cartPrep.success) {
        window.alert(cartPrep.message || '장바구니 준비에 실패했습니다.');
        return;
      }

      const phone = deliveryAddress.phone || deliveryAddress.phoneNumber || '';
      const userCouponId =
        selectedCoupon && selectedCoupon.couponId != null ? selectedCoupon.id : null;

      const orderRes = await createServerOrder({
        cartIds: cartPrep.cartIds,
        customerName: deliveryAddress.recipient || '고객님',
        customerPhoneNumber: phone,
        deliveryAddress,
        couponId: userCouponId,
        discountAmount,
      });

      if (!orderRes.success) {
        window.alert(orderRes.message || '주문 생성에 실패했습니다.');
        if (orderRes.errorCode === 'AUTHORIZATION_001' || orderRes.errorCode === 'CART_001') {
          navigate('/cart', { replace: true });
        }
        return;
      }

      const srv = orderRes.data;
      const payAmount = Math.round(Number(srv.finalAmount));

      if (selectedCoupon) {
        const locals = getReceivedCoupons();
        if (locals.some(c => String(c.id) === String(selectedCoupon.id))) {
          applyCoupon(selectedCoupon.id);
        }
      }

      const paymentData = {
        amount: payAmount,
        orderId: srv.orderId,
        orderName,
        customerName: deliveryAddress.recipient || '고객님',
        deliveryAddress,
        orderItems,
        fromCart,
        cartIds: cartPrep.cartIds,
        coupon: selectedCoupon,
        discountAmount,
        orderSubtotalBeforeDiscount: subtotal,
        serverOrderId: srv.orderId,
        serverOrderNumericId: srv.id,
      };

      sessionStorage.setItem('pendingOrder', JSON.stringify(paymentData));
      await processPayment({
        ...paymentData,
        customerName: deliveryAddress.recipient || '고객님',
      });
    } catch (error) {
      window.alert(`결제 처리 중 오류가 발생했습니다: ${error.message}`);
      sessionStorage.removeItem('pendingOrder');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="order-checkout-page">
        <div className="order-checkout-loading">주문 정보를 불러오는 중...</div>
      </div>
    );
  }

  if (!orderItems.length) {
    return (
      <div className="order-checkout-page">
        <div className="order-checkout-empty">
          <h2>주문할 상품이 없습니다</h2>
          <p>장바구니에서 상품을 선택한 후 주문하기를 눌러주세요.</p>
          <button className="order-checkout-btn-back" onClick={() => navigate('/cart')}>
            장바구니로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-checkout-page">
      <div className="order-checkout-container">
        <h1 className="order-checkout-title">주문/결제</h1>

        {/* 주문 상품 목록 */}
        <section className="order-checkout-section">
          <h2 className="order-checkout-section-title">주문 상품 ({orderItems.length}건)</h2>
          <div className="order-checkout-items">
            {orderItems.map((item, index) => (
              <div 
                key={item.cartId || item.productId || index} 
                className="order-checkout-item"
                onClick={() => navigate(`/product/${item.productId}`)}
                style={{ cursor: 'pointer' }}
              >
                <img
                  src={item.image || 'https://via.placeholder.com/80?text=No+Image'}
                  alt={item.name}
                  className="order-checkout-item-image"
                />
                <div className="order-checkout-item-info">
                  <span className="order-checkout-item-name">{item.name}</span>
                  <span className="order-checkout-item-option">수량: {item.quantity}개</span>
                  <span className="order-checkout-item-price">
                    {orderLineTotal(item).toLocaleString()}원
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 배송지 */}
        <section className="order-checkout-section">
          <div className="order-checkout-section-header">
            <h2 className="order-checkout-section-title">배송지</h2>
            {deliveryAddress && (
              <button className="delivery-change-btn-header" onClick={handleChangeAddress}>
                변경하기
              </button>
            )}
          </div>
          <div className="order-checkout-delivery">
            {!deliveryAddress ? (
              <div className="delivery-address-empty">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>배송 받을 주소를 설정해보세요.</span>
                <button className="address-set-btn" onClick={handleAddressSet}>
                  설정하기
                </button>
              </div>
            ) : (
              <div className="delivery-address">
                <div className="delivery-address-info">
                  <span className="delivery-address-label">✓ 배송지:</span>
                  {deliveryAddress.postcode && (
                    <span className="delivery-postcode">[{deliveryAddress.postcode}]</span>
                  )}
                  <span className="delivery-address-text">{deliveryAddress.address}</span>
                  {deliveryAddress.recipient && (
                    <span className="delivery-recipient">받는 분: {deliveryAddress.recipient}</span>
                  )}
                  {deliveryAddress.phone && (
                    <span className="delivery-phone">연락처: {deliveryAddress.phone}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 결제 금액 */}
        <section className="order-checkout-section order-checkout-summary">
          <h2 className="order-checkout-section-title">결제 금액</h2>
          <div className="order-checkout-summary-rows">
            <div className="order-checkout-summary-row">
              <span>상품금액</span>
              <span>{subtotal.toLocaleString()}원</span>
            </div>
            <div className="order-checkout-summary-row coupon-row">
              <div className="coupon-label-section">
                <span className="coupon-label">
                  할인/쿠폰
                  <span className="coupon-help-icon" title="쿠폰을 선택하여 할인을 받을 수 있습니다">(?)</span>
                </span>
                <button 
                  type="button" 
                  className="coupon-change-btn"
                  onClick={() => {
                    void loadAvailableCoupons();
                    setShowCouponModal(true);
                  }}
                >
                  변경
                </button>
              </div>
              <div className="coupon-discount-section">
                {selectedCoupon ? (
                  <>
                    {selectedCoupon.discountType === 'percent' && (
                      <span className="coupon-max-badge">최대 적용중</span>
                    )}
                    <span className="coupon-discount-amount">-{discountAmount.toLocaleString()}원</span>
                  </>
                ) : (
                  <span className="coupon-none">적용 안함</span>
                )}
              </div>
            </div>
            <div className="order-checkout-summary-row">
              <span>배송비</span>
              <span>{shipping === 0 ? '무료' : `${shipping.toLocaleString()}원`}</span>
            </div>
            <div className="order-checkout-summary-row total-row">
              <span>총 주문금액</span>
              <span className="order-checkout-total-amount">{total.toLocaleString()}원</span>
            </div>
          </div>
        </section>

        {/* 결제하기 버튼 */}
        <div className="order-checkout-actions">
          <button type="button" className="order-checkout-btn-back" onClick={() => navigate(-1)}>
            이전
          </button>
          <button
            type="button"
            className="order-checkout-btn-pay"
            onClick={handlePayment}
            disabled={paying || !deliveryAddress}
          >
            {paying ? '결제 처리 중...' : `${total.toLocaleString()}원 결제하기`}
          </button>
        </div>
      </div>

      {/* 배송지 선택 모달 */}
      {showDeliveryAddressModal && (
        <div className="delivery-address-modal-overlay" onClick={() => setShowDeliveryAddressModal(false)}>
          <div className="delivery-address-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delivery-address-modal-header">
              <h3>배송지 선택</h3>
              <button className="delivery-address-modal-close" onClick={() => setShowDeliveryAddressModal(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="delivery-address-modal-body">
              {loadingAddresses ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p>배송지를 불러오는 중...</p>
                </div>
              ) : deliveryAddresses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p>등록된 배송지가 없습니다.</p>
                  <button 
                    className="delivery-address-add-btn"
                    onClick={handleOpenAddAddressModal}
                    style={{ marginTop: '1rem', padding: '0.5rem 1rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    + 배송지 추가
                  </button>
                </div>
              ) : (
                <div className="delivery-address-list">
                  {deliveryAddresses.map((address) => (
                    <div 
                      key={address.id} 
                      className={`delivery-address-item ${address.isDefault ? 'default' : ''}`}
                      onClick={() => handleSelectDeliveryAddress(address)}
                      style={{ cursor: 'pointer', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '0.5rem' }}
                    >
                      {address.isDefault && (
                        <div style={{ color: '#007bff', fontSize: '0.8rem', marginBottom: '0.5rem' }}>기본 배송지</div>
                      )}
                      <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{address.recipient}</div>
                      <div style={{ color: '#666', fontSize: '0.9rem' }}>
                        [{address.postcode}] {address.address} {address.detailAddress || ''}
                      </div>
                      <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.25rem' }}>{address.phoneNumber}</div>
                    </div>
                  ))}
                  <button 
                    className="delivery-address-add-btn"
                    onClick={handleOpenAddAddressModal}
                    style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', backgroundColor: '#e3f2fd', border: '2px dashed #2196f3', borderRadius: '4px', cursor: 'pointer', color: '#1976d2', fontWeight: '500', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#bbdefb';
                      e.target.style.borderColor = '#1976d2';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#e3f2fd';
                      e.target.style.borderColor = '#2196f3';
                    }}
                  >
                    + 새 배송지 추가
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 새 배송지 추가/변경 모달 */}
      {showAddAddressModal && (
        <div className="delivery-address-modal-overlay" onClick={() => setShowAddAddressModal(false)}>
          <div className="delivery-address-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="delivery-address-modal-header">
              <h3>{deliveryAddress ? '배송지 변경' : '배송지 추가'}</h3>
              <button className="delivery-address-modal-close" onClick={() => setShowAddAddressModal(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="delivery-address-modal-body">
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">
                  우편번호 <span className="required">*</span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={newAddressForm.postcode}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, postcode: e.target.value })}
                    placeholder="우편번호"
                    className="form-input"
                    maxLength="10"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleSearchAddress}
                    style={{ padding: '0.5rem 1rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    주소 검색
                  </button>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">
                  주소 <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={newAddressForm.address}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, address: e.target.value })}
                  placeholder="주소"
                  className="form-input"
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">상세주소</label>
                <input
                  type="text"
                  value={newAddressForm.detailAddress}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, detailAddress: e.target.value })}
                  placeholder="상세주소 (선택사항)"
                  className="form-input"
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">
                  수령인 <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={newAddressForm.recipient}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, recipient: e.target.value })}
                  placeholder="수령인 이름"
                  className="form-input"
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">
                  전화번호 <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  value={newAddressForm.phoneNumber}
                  onChange={(e) =>
                    setNewAddressForm({
                      ...newAddressForm,
                      phoneNumber: formatKoreanMobilePhone(e.target.value),
                    })
                  }
                  placeholder="010-1234-5678"
                  className="form-input"
                  maxLength={13}
                  inputMode="numeric"
                  autoComplete="tel"
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newAddressForm.isDefault}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, isDefault: e.target.checked })}
                  />
                  <span>기본 배송지로 설정</span>
                </label>
              </div>
            </div>
            <div className="delivery-address-modal-footer" style={{ display: 'flex', gap: '0.5rem', padding: '1rem', borderTop: '1px solid #ddd' }}>
              <button
                className="delivery-address-modal-btn cancel"
                onClick={() => setShowAddAddressModal(false)}
                style={{ flex: 1, padding: '0.75rem', backgroundColor: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                취소
              </button>
              <button
                className="delivery-address-modal-btn submit"
                onClick={handleSaveNewAddress}
                style={{ flex: 1, padding: '0.75rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                {deliveryAddress ? '저장하기' : '추가하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 쿠폰 선택 모달 */}
      {showCouponModal && (
        <div className="coupon-modal-overlay" onClick={() => setShowCouponModal(false)}>
          <div className="coupon-modal" onClick={(e) => e.stopPropagation()}>
            <div className="coupon-modal-header">
              <h2 className="coupon-modal-title">할인/쿠폰</h2>
              <button className="coupon-modal-close" onClick={() => setShowCouponModal(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="coupon-modal-body">
              {/* 현재 할인 상태 */}
              <div className="coupon-current-discount">
                <div className="coupon-discount-amount-large">
                  {selectedCoupon ? discountAmount.toLocaleString() : '0'}원
                </div>
                <div className="coupon-discount-status">
                  {selectedCoupon ? '할인 적용중이에요' : '할인이 적용되지 않았어요'}
                </div>
              </div>

              {/* 판매자/배송 정보 */}
              <div className="coupon-seller-info">
                <span className="coupon-seller-name">밤토리사장</span>
                <span className="coupon-delivery-status">무료 배송</span>
              </div>

              {/* 상품 정보 카드 */}
              {orderItems.length > 0 && (
                <div className="coupon-product-card">
                  <div className="coupon-product-image-section">
                    <img
                      src={orderItems[0].image || 'https://via.placeholder.com/80?text=No+Image'}
                      alt={orderItems[0].name}
                      className="coupon-product-image"
                    />
                  </div>
                  <div className="coupon-product-info">
                    <div className="coupon-product-name">{orderItems[0].name}</div>
                    <div className="coupon-product-option">
                      <span className="coupon-option-badge">옵션</span>
                      <span className="coupon-option-detail">
                        {orderItems[0].quantity}개
                      </span>
                    </div>
                    <div className="coupon-product-price">
                      <span className="coupon-original-price">{subtotal.toLocaleString()}원</span>
                      <span className="coupon-discounted-price">
                        {(subtotal - (selectedCoupon ? discountAmount : 0)).toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 할인 적용 옵션 */}
              <div className="coupon-options-section">
                <h3 className="coupon-options-title">할인 적용</h3>
                {availableCoupons.length > 0 && (
                  <div className="coupon-options-list">
                    {availableCoupons.map((coupon) => {
                      const couponDiscount = coupon.discountType === 'fixed' 
                        ? coupon.discount 
                        : Math.floor(subtotal * (coupon.discount / 100));
                      return (
                        <label 
                          key={coupon.id} 
                          className={`coupon-option-item ${selectedCoupon?.id === coupon.id ? 'selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name="coupon"
                            checked={selectedCoupon?.id === coupon.id}
                            onChange={() => setSelectedCoupon(coupon)}
                          />
                          <div className="coupon-option-content">
                            <span className="coupon-option-label">{coupon.name || '즉시 할인'}</span>
                            <span className="coupon-option-discount">-{couponDiscount.toLocaleString()}원</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
                <label className={`coupon-option-item ${selectedCoupon === null ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="coupon"
                    checked={selectedCoupon === null}
                    onChange={() => setSelectedCoupon(null)}
                  />
                  <div className="coupon-option-content">
                    <span className="coupon-option-label">적용 안 함</span>
                  </div>
                </label>
              </div>
            </div>

            {/* 하단 적용 버튼 */}
            <div className="coupon-modal-footer">
              <button
                type="button"
                className="coupon-apply-btn"
                onClick={() => setShowCouponModal(false)}
              >
                {selectedCoupon 
                  ? `- ${discountAmount.toLocaleString()}원 할인 적용`
                  : '할인 적용'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderCheckout;
