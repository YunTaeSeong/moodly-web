import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isLoggedIn } from '../utils/cookie';
import './Cart.css';

// 장바구니 상품 데이터 (5개 상품, 랜덤 수량)
const getRandomQuantity = () => Math.floor(Math.random() * 5) + 1; // 1~5 랜덤

const initialCartItems = [
  {
    id: 1,
    name: '스마트폰 케이스',
    price: 15000,
    image: 'https://images.unsplash.com/photo-1601972602237-8c79241e468b?w=200&h=200&fit=crop',
    quantity: getRandomQuantity(),
    checked: true
  },
  {
    id: 2,
    name: '무선 이어폰',
    price: 89000,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200&h=200&fit=crop',
    quantity: getRandomQuantity(),
    checked: true
  },
  {
    id: 3,
    name: '노트북 스탠드',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=200&h=200&fit=crop',
    quantity: getRandomQuantity(),
    checked: true
  },
  {
    id: 4,
    name: '블루투스 스피커',
    price: 120000,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=200&h=200&fit=crop',
    quantity: getRandomQuantity(),
    checked: true
  },
  {
    id: 5,
    name: '스마트 워치',
    price: 250000,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop',
    quantity: getRandomQuantity(),
    checked: true
  }
];

const SHIPPING_FEE = 3000;

function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState(initialCartItems);

  useEffect(() => {
    // 로그인 체크
    if (!isLoggedIn()) {
      navigate('/login');
    }
  }, [navigate]);

  // 체크박스 토글
  const handleCheckToggle = (id) => {
    setCartItems(cartItems.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  // 전체 선택/해제
  const handleSelectAll = (checked) => {
    setCartItems(cartItems.map(item => ({ ...item, checked })));
  };

  // 수량 증가
  const handleIncreaseQuantity = (id) => {
    setCartItems(cartItems.map(item =>
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };

  // 수량 감소
  const handleDecreaseQuantity = (id) => {
    setCartItems(cartItems.map(item =>
      item.id === id && item.quantity > 1
        ? { ...item, quantity: item.quantity - 1 }
        : item
    ));
  };

  // 수량 직접 입력
  const handleQuantityChange = (id, value) => {
    const numValue = parseInt(value) || 1;
    if (numValue < 1) return;
    setCartItems(cartItems.map(item =>
      item.id === id ? { ...item, quantity: numValue } : item
    ));
  };

  // 개별 상품 삭제 (체크박스 선택 필수)
  const handleDeleteItem = (id) => {
    const item = cartItems.find(item => item.id === id);
    if (!item) return;

    // 체크박스가 선택되지 않았으면 알람 표시
    if (!item.checked) {
      window.alert('체크박스를 선택해주세요.');
      return;
    }

    // 체크박스가 선택되어 있으면 삭제 확인
    if (window.confirm('이 상품을 장바구니에서 삭제하시겠습니까?')) {
      setCartItems(cartItems.filter(item => item.id !== id));
    }
  };

  // 전체 삭제
  const handleDeleteAll = () => {
    if (cartItems.length === 0) {
      window.alert('삭제할 상품이 없습니다.');
      return;
    }

    if (window.confirm('장바구니의 모든 상품을 삭제하시겠습니까?')) {
      setCartItems([]);
    }
  };

  // 선택된 상품들의 합계 계산
  const selectedItems = cartItems.filter(item => item.checked);
  const subtotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + SHIPPING_FEE;
  const allChecked = cartItems.length > 0 && cartItems.every(item => item.checked);

  if (!isLoggedIn()) {
    return null;
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
                  title="전체 삭제"
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
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-checkbox">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleCheckToggle(item.id)}
                      />
                    </div>
                    <div 
                      className="cart-item-image"
                      onClick={() => navigate(`/product/${item.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <img src={item.image} alt={item.name} />
                    </div>
                    <div className="cart-item-info">
                      <h3 
                        className="cart-item-name"
                        onClick={() => navigate(`/product/${item.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        {item.name}
                      </h3>
                      <p className="cart-item-price">1개당 가격: {item.price.toLocaleString()}원</p>
                      <p className="cart-item-shipping">배송비: {SHIPPING_FEE.toLocaleString()}원</p>
                    </div>
                    <div className="cart-item-quantity">
                      <button
                        className="quantity-btn decrease"
                        onClick={() => handleDecreaseQuantity(item.id)}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                        className="quantity-input"
                      />
                      <button
                        className="quantity-btn increase"
                        onClick={() => handleIncreaseQuantity(item.id)}
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
                        onClick={() => handleDeleteItem(item.id)}
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
                  <span>{SHIPPING_FEE.toLocaleString()}원</span>
                </div>
                <div className="summary-row total-row">
                  <span>총 결제금액</span>
                  <span className="total-amount">{total.toLocaleString()}원</span>
                </div>
              </div>
              <button className="order-button">
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

