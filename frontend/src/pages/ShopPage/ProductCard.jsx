import React, { useState } from 'react';
import { Rate, } from 'antd';

const ProductCard = ({ product, onAddToCart, onBuyNow }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col justify-between transition-all duration-500 
            hover:-translate-y-2 hover:shadow-2xl group cursor-pointer relative overflow-hidden">
      {product.tag && (
        <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded z-10 shadow">
          {product.tag}
        </span>
      )}

      <div>
        <div className="w-full h-52 overflow-hidden rounded-md mb-4 bg-gray-50 flex items-center justify-center">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        </div>

        <h4 className="text-sm font-medium text-gray-800 line-clamp-2 mb-3 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h4>
      </div>

      <div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-base font-bold text-gray-900">{product.price} Đ</span>
          {product.oldPrice && (
            <span className="text-xs text-gray-400 line-through">{product.oldPrice} Đ</span>
          )}
        </div>

        <div className="flex items-center">
          {product.rating > 0 ? (
            <Rate disabled defaultValue={product.rating} className="text-xs text-yellow-400" />
          ) : (
            <div className="flex gap-0.5 text-gray-300 text-xs">
              {[...Array(5)].map((_, i) => (
                <span key={i}>★</span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={onBuyNow}
            className="flex-1 bg-white border border-[#1b2a4a] text-[#1b2a4a] hover:bg-[#1b2a4a] hover:text-white py-1.5 rounded-md font-bold text-sm transition-colors"
          >
            MUA NGAY
          </button>
          <button
            onClick={onAddToCart}
            className="w-9 h-9 flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-600 rounded-md hover:border-[#1b2a4a] hover:text-[#1b2a4a] transition-all shadow-sm"
            title="Thêm vào giỏ hàng"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard; 