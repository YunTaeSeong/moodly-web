import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isLoggedIn } from '../utils/cookie';
import { getUserIdFromToken } from '../utils/token';
import {
  orderSubtotalFromItems,
  shippingFeeForSubtotal,
  shippingFeeLabelForSubtotal
} from '../utils/pricing';
import {
  getCartItems,
  updateCartQuantity,
  deleteCartItem,
  updateCartChecked,
  updateAllCartChecked,
  deleteSelectedCartItems
} from '../utils/api';
import './Cart.css';

function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  /** 계정(JWT sub)이 바뀌면 장바구니를 다시 불러와 이전 계정의 cartId가 남지 않게 함 */
  const accountKey = String(getUserIdFromToken() ?? '');

  // 장바구니 데이터 로드
  useEffect(() => {
    const loadCartItems = async () => {
      if (!isLoggedIn()) {
        navigate('/login');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getCartItems();
        if (result.success && result.data) {
          // 백엔드 응답을 프론트엔드 형식으로 변환
          const formattedItems = result.data.map(item => ({
            id: item.id, // cartId
            cartId: item.id,
            productId: item.productId,
            name: item.productName || '상품명 없음',
            price: item.productPrice ? parseFloat(item.productPrice) : 0,
            productDiscount: item.productDiscount != null ? item.productDiscount : 0,
            image: item.productImage || 'https://via.placeholder.com/200?text=No+Image',
            quantity: item.quantity || 1,
            checked: item.checked !== undefined ? item.checked : true
          }));
          setCartItems(formattedItems);
        } else {
          setCartItems([]);
        }
      } catch (err) {
        console.error('장바구니 로드 오류:', err);
        setError('장바구니를 불러오는 중 오류가 발생했습니다.');
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadCartItems();
  }, [navigate, accountKey]);

  // 체크박스 토글
  const handleCheckToggle = async (cartId, currentChecked) => {
    const newChecked = !currentChecked;
    
    // 즉시 UI 업데이트
    setCartItems(cartItems.map(item =>
      item.cartId === cartId ? { ...item, checked: newChecked } : item
    ));

    // 백엔드에 반영
    try {
      const result = await updateCartChecked(cartId, newChecked);
      if (!result.success) {
        // 실패 시 롤백
        setCartItems(cartItems.map(item =>
          item.cartId === cartId ? { ...item, checked: currentChecked } : item
        ));
        window.alert(result.message || '체크박스 업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('체크박스 업데이트 오류:', error);
      // 실패 시 롤백
      setCartItems(cartItems.map(item =>
        item.cartId === cartId ? { ...item, checked: currentChecked } : item
      ));
      window.alert('체크박스 업데이트 중 오류가 발생했습니다.');
    }
  };

  // 전체 선택/해제
  const handleSelectAll = async (checked) => {
    // 즉시 UI 업데이트
    setCartItems(cartItems.map(item => ({ ...item, checked })));

    // 백엔드에 반영
    try {
      const result = await updateAllCartChecked(checked);
      if (!result.success) {
        // 실패 시 롤백
        setCartItems(cartItems.map(item => ({ ...item, checked: !checked })));
        window.alert(result.message || '전체 선택/해제에 실패했습니다.');
      }
    } catch (error) {
      console.error('전체 선택/해제 오류:', error);
      // 실패 시 롤백
      setCartItems(cartItems.map(item => ({ ...item, checked: !checked })));
      window.alert('전체 선택/해제 중 오류가 발생했습니다.');
    }
  };

  // 수량 증가
  const handleIncreaseQuantity = async (cartId, currentQuantity) => {
    const newQuantity = currentQuantity + 1;
    
    // 즉시 UI 업데이트
    setCartItems(cartItems.map(item =>
      item.cartId === cartId ? { ...item, quantity: newQuantity } : item
    ));

    // 백엔드에 반영
    try {
      const result = await updateCartQuantity(cartId, newQuantity);
      if (!result.success) {
        // 실패 시 롤백
        setCartItems(cartItems.map(item =>
          item.cartId === cartId ? { ...item, quantity: currentQuantity } : item
        ));
        window.alert(result.message || '수량 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('수량 변경 오류:', error);
      // 실패 시 롤백
      setCartItems(cartItems.map(item =>
        item.cartId === cartId ? { ...item, quantity: currentQuantity } : item
      ));
      window.alert('수량 변경 중 오류가 발생했습니다.');
    }
  };

  // 수량 감소
  const handleDecreaseQuantity = async (cartId, currentQuantity) => {
    if (currentQuantity <= 1) return;
    
    const newQuantity = currentQuantity - 1;
    
    // 즉시 UI 업데이트
    setCartItems(cartItems.map(item =>
      item.cartId === cartId ? { ...item, quantity: newQuantity } : item
    ));

    // 백엔드에 반영
    try {
      const result = await updateCartQuantity(cartId, newQuantity);
      if (!result.success) {
        // 실패 시 롤백
        setCartItems(cartItems.map(item =>
          item.cartId === cartId ? { ...item, quantity: currentQuantity } : item
        ));
        window.alert(result.message || '수량 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('수량 변경 오류:', error);
      // 실패 시 롤백
      setCartItems(cartItems.map(item =>
        item.cartId === cartId ? { ...item, quantity: currentQuantity } : item
      ));
      window.alert('수량 변경 중 오류가 발생했습니다.');
    }
  };

  // 수량 직접 입력
  const handleQuantityChange = async (cartId, value, currentQuantity) => {
    const numValue = parseInt(value) || 1;
    if (numValue < 1) return;
    
    // 즉시 UI 업데이트
    setCartItems(cartItems.map(item =>
      item.cartId === cartId ? { ...item, quantity: numValue } : item
    ));

    // 백엔드에 반영
    try {
      const result = await updateCartQuantity(cartId, numValue);
      if (!result.success) {
        // 실패 시 롤백
        setCartItems(cartItems.map(item =>
          item.cartId === cartId ? { ...item, quantity: currentQuantity } : item
        ));
        window.alert(result.message || '수량 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('수량 변경 오류:', error);
      // 실패 시 롤백
      setCartItems(cartItems.map(item =>
        item.cartId === cartId ? { ...item, quantity: currentQuantity } : item
      ));
      window.alert('수량 변경 중 오류가 발생했습니다.');
    }
  };

  // 개별 상품 삭제
  const handleDeleteItem = async (cartId) => {
    const item = cartItems.find(item => item.cartId === cartId);
    if (!item) return;

    // 체크박스가 선택되지 않았으면 알람 표시
    if (!item.checked) {
      window.alert('체크박스를 선택해주세요.');
      return;
    }

    // 삭제 확인
    if (window.confirm('이 상품을 장바구니에서 삭제하시겠습니까?')) {
      try {
        const result = await deleteCartItem(cartId);
        if (result.success) {
          // 성공 시 목록에서 제거
          setCartItems(cartItems.filter(item => item.cartId !== cartId));
        } else {
          window.alert(result.message || '장바구니 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('장바구니 삭제 오류:', error);
        window.alert('장바구니 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 전체 삭제 (선택된 상품만)
  const handleDeleteAll = async () => {
    const selectedItems = cartItems.filter(item => item.checked);
    
    if (selectedItems.length === 0) {
      window.alert('삭제할 상품이 없습니다. 체크박스를 선택해주세요.');
      return;
    }

    if (window.confirm(`선택된 ${selectedItems.length}개의 상품을 장바구니에서 삭제하시겠습니까?`)) {
      try {
        const cartIds = selectedItems.map(item => item.cartId);
        const result = await deleteSelectedCartItems(cartIds);
        if (result.success) {
          // 성공 시 선택된 항목만 목록에서 제거
          setCartItems(cartItems.filter(item => !item.checked));
        } else {
          window.alert(result.message || '선택된 상품 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('선택된 상품 삭제 오류:', error);
        window.alert('선택된 상품 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 선택된 상품들의 합계 계산
  const selectedItems = cartItems.filter(item => item.checked);
  const subtotal = orderSubtotalFromItems(selectedItems);
  const shipping = shippingFeeForSubtotal(subtotal);
  const total = subtotal + shipping;
  const allChecked = cartItems.length > 0 && cartItems.every(item => item.checked);

  if (!isLoggedIn()) {
    return null;
  }

  if (loading) {
    return (
      <div className="cart-container">
        <div className="cart-content">
          <h1 className="cart-title">장바구니</h1>
          <div className="cart-empty">
            <p>장바구니를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cart-container">
        <div className="cart-content">
          <h1 className="cart-title">장바구니</h1>
          <div className="cart-empty">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-content">
        <h1 className="cart-title">장바구니</h1>

        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <p>장바구니가 비어있습니다.</p>
          </div>
        ) : (
          <>
            <div className="cart-items-section">
              <div className="cart-header">
                <label className="select-all-checkbox">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <span>전체 선택</span>
                </label>
                <button 
                  className="delete-all-button"
                  onClick={handleDeleteAll}
                  title="선택된 상품 삭제"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>

              <div className="cart-items-list">
                {cartItems.map((item) => (
                  <div key={item.cartId} className="cart-item">
                    <div className="cart-item-checkbox">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleCheckToggle(item.cartId, item.checked)}
                      />
                    </div>
                    <div 
                      className="cart-item-image"
                      onClick={() => navigate(`/product/${item.productId}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <img src={item.image} alt={item.name} />
                    </div>
                    <div className="cart-item-info">
                      <h3 
                        className="cart-item-name"
                        onClick={() => navigate(`/product/${item.productId}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        {item.name}
                      </h3>
                      <p className="cart-item-price">1개당 가격: {item.price.toLocaleString()}원</p>
                      <p className="cart-item-shipping">
                        배송비: {shippingFeeLabelForSubtotal(subtotal)}
                      </p>
                    </div>
                    <div className="cart-item-quantity">
                      <button
                        className="quantity-btn decrease"
                        onClick={() => handleDecreaseQuantity(item.cartId, item.quantity)}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.cartId, e.target.value, item.quantity)}
                        className="quantity-input"
                      />
                      <button
                        className="quantity-btn increase"
                        onClick={() => handleIncreaseQuantity(item.cartId, item.quantity)}
                      >
                        +
                      </button>
                    </div>
                    <div className="cart-item-total">
                      <p className="item-total-price">
                        {(item.price * item.quantity).toLocaleString()}원
                      </p>
                    </div>
                    <div className="cart-item-delete">
                      <button
                        className="delete-item-button"
                        onClick={() => handleDeleteItem(item.cartId)}
                        title="삭제"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="cart-summary">
              <h2 className="summary-title">주문금액</h2>
              <div className="summary-details">
                <div className="summary-row">
                  <span>상품금액</span>
                  <span>{subtotal.toLocaleString()}원</span>
                </div>
                <div className="summary-row">
                  <span>배송비</span>
                  <span>{shipping === 0 ? '무료' : `${shipping.toLocaleString()}원`}</span>
                </div>
                <div className="summary-row total-row">
                  <span>총 결제금액</span>
                  <span className="total-amount">{total.toLocaleString()}원</span>
                </div>
              </div>
              <button
                className="order-button"
                onClick={() => {
                  const selected = cartItems.filter(item => item.checked);
                  if (selected.length === 0) {
                    window.alert('주문할 상품을 선택해주세요.');
                    return;
                  }
                  navigate('/order/checkout', {
                    state: {
                      from: 'cart',
                      items: selected,
                      cartIds: selected.map(item => item.cartId)
                    }
                  });
                }}
              >
                주문하기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Cart;
