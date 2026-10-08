import React from 'react';
import { Rate } from 'antd';
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ product, onAddToCart, onBuyNow }) => {
  const navigate = useNavigate();
  
  const numericPrice = typeof product.price === 'number' 
    ? product.price 
    : parseFloat(String(product.price).replace(/[^0-9.]/g, '')) || 0;

  const numericOldPrice = product.originalPrice 
    ? (typeof product.originalPrice === 'number' ? product.originalPrice : parseFloat(String(product.originalPrice).replace(/[^0-9.]/g, '')))
    : (product.oldPrice ? parseFloat(String(product.oldPrice).replace(/[^0-9.]/g, '')) : null);

  const formatPrice = (val) => new Intl.NumberFormat('vi-VN').format(val);

  const discountPercent = numericOldPrice && numericOldPrice > numericPrice
    ? Math.round(((numericOldPrice - numericPrice) / numericOldPrice) * 100)
    : null;

  const isOutOfStock = product.stockQuantity !== undefined && product.stockQuantity <= 0;
  const tag = product.tag || (discountPercent ? `-${discountPercent}%` : (product.soldCount > 300 ? 'BÁN CHẠY' : null));

  const handleCardClick = () => {
    if (product.id) navigate(`/shop/product/${product.id}`);
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between transition-all duration-300 
            hover:-translate-y-1.5 hover:shadow-xl group relative overflow-hidden ${isOutOfStock ? 'opacity-75' : ''}`}>
      {tag && (
        <span className="absolute top-3 left-3 bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full z-10 shadow-sm">
          {tag}
        </span>
      )}

      {isOutOfStock && (
        <span className="absolute top-3 right-3 bg-gray-700 text-white text-[10px] font-bold px-2 py-0.5 rounded z-10">
          HẾT HÀNG
        </span>
      )}

      <div onClick={handleCardClick} className="cursor-pointer">
        <div className="w-full h-52 overflow-hidden rounded-lg mb-3 bg-gray-50 flex items-center justify-center">
          <img
            src={product.imageUrl || product.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>

        <h4 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-2 group-hover:text-[#60a5fa] transition-colors" title={product.name}>
          {product.name}
        </h4>
      </div>

      <div>
        <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
          <span className="text-base font-bold text-red-600">{formatPrice(numericPrice)}đ</span>
          {numericOldPrice && numericOldPrice > numericPrice && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(numericOldPrice)}đ</span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <Rate disabled value={product.rating || 5} allowHalf className="text-xs text-yellow-400" />
            <span className="text-gray-700 font-medium ml-1">({Number(product.rating || 5).toFixed(1)})</span>
          </div>
          {product.soldCount !== undefined && (
            <span className="text-gray-400">Đã bán {product.soldCount}</span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={(e) => { e.stopPropagation(); onBuyNow && onBuyNow(e); }}
            disabled={isOutOfStock}
            className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${
              isOutOfStock 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white border border-[#60a5fa] text-[#60a5fa] hover:bg-[#60a5fa] hover:text-white shadow-sm'
            }`}
          >
            {isOutOfStock ? 'HẾT HÀNG' : 'MUA NGAY'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart && onAddToCart(e); }}
            disabled={isOutOfStock}
            className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all shadow-sm ${
              isOutOfStock 
                ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed' 
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-[#60a5fa] hover:text-[#60a5fa] hover:bg-blue-50'
            }`}
            title={isOutOfStock ? 'Sản phẩm đã hết hàng' : 'Thêm vào giỏ hàng'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;