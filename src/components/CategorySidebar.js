import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CategorySidebar.css';

const categories = [
  {
    id: 'clothing',
    name: '의류',
    subCategories: ['남성의류', '여성의류', '아동의류', '언더웨어', '액세서리', '신발', '가방', '시계']
  },
  {
    id: 'electronics',
    name: '가전용품',
    subCategories: ['TV/영상가전', '냉장고', '세탁기/건조기', '청소기', '공기청정기', '에어컨', '주방가전', '생활가전']
  },
  {
    id: 'food',
    name: '푸드',
    subCategories: ['신선식품', '냉동식품', '간편식', '과자/스낵', '음료', '커피/차', '건강식품', '다이어트식품']
  },
  {
    id: 'beauty',
    name: '뷰티',
    subCategories: ['스킨케어', '메이크업', '향수', '헤어케어', '바디케어', '남성화장품', '네일', '선케어']
  },
  {
    id: 'home-interior',
    name: '홈인테리어',
    subCategories: ['가구', '침구/커튼', '조명', '수납/정리', '인테리어소품', '주방용품', '욕실용품', '생활용품']
  }
];

function CategorySidebar({ onClose }) {
  const navigate = useNavigate();
  const [hoveredCategory, setHoveredCategory] = useState(categories[0]?.id || null);

  // 카테고리 클릭 핸들러
  const handleCategoryClick = (categoryId) => {
    navigate(`/category/${categoryId}`);
    onClose();
  };

  // 서브카테고리 클릭 핸들러
  const handleSubCategoryClick = (categoryId, subCategoryName) => {
    navigate(`/category/${categoryId}?sub=${encodeURIComponent(subCategoryName)}`);
    onClose();
  };

  return (
    <div className="category-dropdown-menu">
      <div className="category-dropdown-wrapper">
        <div className="category-sidebar">
          <div className="category-sidebar-list">
            {categories.map((category) => (
              <div
                key={category.id}
                className={`category-sidebar-item ${hoveredCategory === category.id ? 'active' : ''}`}
                onMouseEnter={() => setHoveredCategory(category.id)}
                onClick={() => handleCategoryClick(category.id)}
              >
                <span className="category-sidebar-name">{category.name}</span>
                <svg 
                  className="category-arrow-icon"
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            ))}
          </div>
        </div>

        {/* 모든 서브카테고리 패널 - 한번에 표시 */}
        <div className="subcategory-panel">
          {categories.map((category) => (
            <div 
              key={category.id}
              className={`subcategory-section ${hoveredCategory === category.id ? 'active' : ''}`}
              onMouseEnter={() => setHoveredCategory(category.id)}
            >
              {category.subCategories && category.subCategories.length > 0 && (
                <div className="subcategory-list-section">
                  {category.subCategories.map((subCategory, index) => (
                    <div 
                      key={index}
                      className="subcategory-item"
                      onClick={() => handleSubCategoryClick(category.id, subCategory)}
                    >
                      {subCategory}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CategorySidebar;

