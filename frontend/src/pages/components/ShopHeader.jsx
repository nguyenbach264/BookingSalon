import React, { useState } from 'react';
import {
  Badge
} from 'antd';

const ShopHeader = ({ onLoginClick, onRegisterClick, onCartClick, cartCount }) => {

  return (
    <div className="w-full bg-white text-black shadow-md">
      <div className="max-w-[1280px] mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer">
            <span className="text-2xl font-black italic tracking-wider text-black">BachBarber</span>
            <span className="text-xs bg-red-600 px-1.5 py-0.5 rounded font-bold uppercase">SHOP</span>
          </div>

          <div className="hidden lg:flex items-center relative w-80 outline outline-1 rounded-2xl outline-gray-300">
            <input
              type="text"
              placeholder="Nhập tên sản phẩm, thương hiệu..."
              className="w-full bg-white text-gray-800 text-sm rounded-md py-2 pl-3 pr-10 focus:outline-none"
            />
            <button className="absolute right-3 text-gray-500 hover:text-gray-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onLoginClick}
            className="text-black font-bold py-2 px-5 rounded-md flex items-center gap-2 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            <a className="hover:text-blue-500 font-bold">ĐĂNG NHẬP</a>
          </button>

          <div
            onClick={onCartClick}
            className="flex items-center relative cursor-pointer px-2.5 transition-colors"
          >
            <span className="flex items-center group cursor-pointer text-black">
              <Badge
                count={cartCount} size="small" offset={[2, 0]}
              >
                <svg
                  className="w-5 h-5 text-black group-hover:text-blue-500 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </Badge>
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ShopHeader;