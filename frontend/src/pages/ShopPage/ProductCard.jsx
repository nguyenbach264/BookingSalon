import React from 'react';
import { Rate, Tooltip } from 'antd';
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
    <div className={`h-full bg-white border border-gray-200 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-300 
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

      <div onClick={handleCardClick} className="cursor-pointer flex flex-col">
        <div className="w-full h-44 sm:h-48 overflow-hidden rounded-lg mb-3 bg-gray-50 flex items-center justify-center shrink-0">
          <img
            src={product.imageUrl || product.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>

        <Tooltip title={product.name} placement="top" mouseEnterDelay={0.2}>
          <h4 className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-2 min-h-[38px] sm:min-h-[40px] leading-snug sm:leading-5 mb-2 group-hover:text-[#60a5fa] transition-colors">
            {product.name}
          </h4>
        </Tooltip>
      </div>

      <div className="mt-auto">
        <div className="flex items-baseline gap-1.5 mb-1.5 flex-wrap">
          <span className="text-sm sm:text-base font-bold text-red-600">{formatPrice(numericPrice)}đ</span>
          {numericOldPrice && numericOldPrice > numericPrice && (
            <span className="text-[11px] sm:text-xs text-gray-400 line-through">{formatPrice(numericOldPrice)}đ</span>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] sm:text-xs text-gray-500 mb-2.5">
          <div className="flex items-center gap-1.5">
            {(() => {
              const rawRating = parseFloat(product.rating);
              const validRating = isNaN(rawRating) ? 5 : Math.max(0, Math.min(5, rawRating));
              const fullStars = Math.floor(validRating);
              const hasHalf = validRating > fullStars && validRating < 5;

              return (
                <div className="flex items-center text-amber-400 gap-0.5">
                  {[1, 2, 3, 4, 5].map((index) => {
                    if (index <= fullStars) {
                      // Sao đầy
                      return (
                        <svg key={index} className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400 shrink-0" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      );
                    } else if (index === fullStars + 1 && hasHalf) {
                      // Sao nửa
                      return (
                        <svg key={index} className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" viewBox="0 0 20 20">
                          <defs>
                            <linearGradient id={`pc-half-${product.id || 'x'}-${index}`}>
                              <stop offset="50%" stopColor="#f59e0b" />
                              <stop offset="50%" stopColor="#e5e7eb" />
                            </linearGradient>
                          </defs>
                          <path fill={`url(#pc-half-${product.id || 'x'}-${index})`} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      );
                    } else {
                      // Sao rỗng
                      return (
                        <svg key={index} className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-gray-200 text-gray-200 shrink-0" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      );
                    }
                  })}
                </div>
              );
            })()}
            <span className="text-gray-700 font-bold ml-0.5">
              ({(isNaN(parseFloat(product.rating)) ? 5.0 : parseFloat(product.rating)).toFixed(1)})
            </span>
          </div>
          {product.soldCount !== undefined && (
            <span className="text-gray-400">Đã bán {product.soldCount}</span>
          )}
        </div>

        <div className="pt-2.5 border-t border-gray-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            disabled={isOutOfStock}
            className={`w-full py-2 sm:py-2.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              isOutOfStock 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white border border-[#60a5fa] text-[#60a5fa] hover:bg-[#60a5fa] hover:text-white shadow-sm cursor-pointer'
            }`}
          >
            {isOutOfStock ? 'HẾT HÀNG' : 'MUA NGAY'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;