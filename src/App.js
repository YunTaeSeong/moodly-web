import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import EventDetail from './components/EventDetail';
import CategoryDetail from './components/CategoryDetail';
import Login from './components/Login';
import Signup from './components/Signup';
import Cart from './components/Cart';
import MyPage from './components/MyPage';
import PaymentSuccess from './components/PaymentSuccess';
import PaymentFail from './components/PaymentFail';
import HotDealDetail from './components/HotDealDetail';
import TodaySpecialDetail from './components/TodaySpecialDetail';
import ResetPassword from './components/ResetPassword';
import { isLoggedIn } from './utils/cookie';
import './App.css';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    // 앱 시작 시 로그인 상태 확인
    setLoggedIn(isLoggedIn());
    
    // 쿠키 변경 감지를 위한 주기적 체크
    const interval = setInterval(() => {
      setLoggedIn(isLoggedIn());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <div className="App">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ProductList />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/event/:id" element={<EventDetail />} />
            <Route path="/category/:id" element={<CategoryDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/hotdeal" element={<HotDealDetail />} />
            <Route path="/todayspecial" element={<TodaySpecialDetail />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/fail" element={<PaymentFail />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
