import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Moodly</h3>
            <p>최고의 쇼핑 경험을 제공합니다</p>
          </div>
          <div className="footer-section">
            <h4>고객센터</h4>
            <p>이메일: support@moodly.com</p>
            <p>전화: 1588-0000</p>
          </div>
          <div className="footer-section">
            <h4>운영시간</h4>
            <p>평일: 09:00 - 18:00</p>
            <p>주말: 10:00 - 17:00</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 Moodly. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

