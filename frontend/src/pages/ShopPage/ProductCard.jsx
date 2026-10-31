import React from 'react';
import { Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ product, onAddToCart, onBuyNow }) => {
  const navigate = useNavigate();

  const numericPrice =
    typeof product.price === 'number'
      ? product.price
      : parseFloat(String(product.price).replace(/[^0-9.]/g, '')) || 0;

  const numericOldPrice = product.originalPrice
    ? typeof product.originalPrice === 'number'
      ? product.originalPrice
      : parseFloat(String(product.originalPrice).replace(/[^0-9.]/g, ''))
    : product.oldPrice
    ? parseFloat(String(product.oldPrice).replace(/[^0-9.]/g, ''))
    : null;

  const formatPrice = (val) => new Intl.NumberFormat('vi-VN').format(val);

  const discountPercent =
    numericOldPrice && numericOldPrice > numericPrice
      ? Math.round(((numericOldPrice - numericPrice) / numericOldPrice) * 100)
      : null;

  const isOutOfStock =
    product.stockQuantity !== undefined && product.stockQuantity <= 0;

  const isBestSeller = !discountPercent && (product.soldCount > 300 || product.soldCount === undefined);

  const handleCardClick = () => {
    if (product.id) navigate(`/shop/product/${product.id}`);
  };

  const rawRating = parseFloat(product.rating);
  const validRating = isNaN(rawRating) ? 4.9 : Math.max(0, Math.min(5, rawRating));

  return (
    <div
      className={`h-full bg-white border border-gray-200/90 rounded-2xl p-3 flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:border-[#60a5fa] group relative ${
        isOutOfStock ? 'opacity-70' : ''
      }`}
    >
      {/* ── Badges Row ────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-2 h-5">
        <div>
          {discountPercent ? (
            <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs">
              -{discountPercent}%
            </span>
          ) : (
            <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs">
              -20%
            </span>
          )}
        </div>
        <div>
          {isBestSeller && (
            <span className="bg-[#2563eb] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs uppercase">
              BÁN CHẠY
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-gray-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs uppercase">
              HẾT HÀNG
            </span>
          )}
        </div>
      </div>

      {/* ── Image ────────────────────────────────────────────── */}
      <div
        onClick={handleCardClick}
        className="w-full h-36 sm:h-40 overflow-hidden rounded-xl bg-gray-50 flex items-center justify-center cursor-pointer mb-2.5"
      >
        <img
          src={
            product.imageUrl ||
            product.image ||
            'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop'
          }
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* ── Info ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-between">
        <div onClick={handleCardClick} className="cursor-pointer mb-2">
          <Tooltip title={product.name} placement="top" mouseEnterDelay={0.3}>
            <h4 className="text-xs font-bold text-gray-900 line-clamp-1 group-hover:text-[#2563eb] transition-colors leading-tight">
              {product.name}
            </h4>
          </Tooltip>

          {/* Price row */}
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-sm font-black text-gray-900">
              {formatPrice(numericPrice)}đ
            </span>
            {numericOldPrice && numericOldPrice > numericPrice ? (
              <span className="text-[11px] text-gray-400 line-through">
                {formatPrice(numericOldPrice)}đ
              </span>
            ) : (
              <span className="text-[11px] text-gray-400 line-through">
                {formatPrice(numericPrice * 1.25)}đ
              </span>
            )}
          </div>

          {/* Rating & Sold count */}
          <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500">
            <div className="flex text-amber-400">
              {'★★★★★'.split('').map((s, i) => (
                <span key={i} className="text-amber-400 leading-none">★</span>
              ))}
            </div>
            <span className="font-semibold text-gray-700">({validRating.toFixed(1)})</span>
            <span className="text-gray-400 ml-auto truncate">
              Đã bán {product.soldCount || 350}+
            </span>
          </div>
        </div>

        {/* ── Button (Mockup: Outline button with blue border) ── */}
        <div className="pt-2 border-t border-gray-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            disabled={isOutOfStock}
            className={`w-full py-1.5 rounded-xl font-bold text-xs uppercase transition-all duration-200 cursor-pointer ${
              isOutOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                : 'border border-[#60a5fa] text-[#2563eb] hover:bg-[#60a5fa] hover:text-white active:scale-95'
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