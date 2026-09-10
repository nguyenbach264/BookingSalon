import React, { useState } from 'react';
import { Button, Modal, } from 'antd';

const formatPrice = (price) => {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " Đ";
};

const CartPage = ({ visible, onClose, cartItems, onUpdateQuantity, onRemoveItem, onCheckout }) => {
  const totalPrice = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  const modalFooter = cartItems.length > 0 ? (
    <div className="pt-4 mt-2 space-y-4 border-t border-gray-100">
      <div className="flex justify-between items-center text-base px-2">
        <span className="text-gray-600 font-medium">Tạm tính:</span>
        <span className="font-bold text-gray-900">{formatPrice(totalPrice)}</span>
      </div>
      <div className="flex justify-between items-center text-lg border-t border-dashed border-gray-300 pt-4 px-2">
        <span className="text-gray-900 font-bold uppercase">Tổng cộng:</span>
        <span className="font-black text-red-600 text-2xl">{formatPrice(totalPrice)}</span>
      </div>
      <Button
        type="primary"
        size="large"
        className="w-full h-12 bg-[#1b2a4a] hover:bg-[#244383] font-bold text-base rounded-lg shadow-md border-none uppercase tracking-wide"
        onClick={ onCheckout }
      >
        Thanh Toán Ngay
      </Button>
    </div>
  ) : null;

  return (
    <Modal
      title={
        <div className="flex items-center justify-between pr-8">
          <span className="text-xl font-black text-gray-900">GIỎ HÀNG</span>
          <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {cartItems.length} sản phẩm
          </span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={modalFooter}
      centered
      width={720}
      className="font-sans rounded-xl overflow-hidden"
    >
      <div className="max-h-[50vh] overflow-y-auto py-4 pr-2 -mr-2">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500 gap-4">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z">
                </path>
              </svg>
            </div>
            <p className="text-base font-medium">Giỏ hàng của bạn đang trống</p>
            <Button type="default" onClick={onClose} className="border-blue-600 text-blue-600 hover:text-blue-700 hover:border-blue-700 font-medium">
              Tiếp tục mua sắm
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-4 border border-gray-100 bg-white p-3 rounded-lg shadow-sm group hover:border-blue-200 transition-colors">
                <div className="w-20 h-20 bg-gray-50 rounded-md overflow-hidden flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug pr-6 relative">
                      {item.name}
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="absolute -top-1 -right-2 text-gray-400 hover:text-red-500 p-1 transition-colors bg-white rounded-full"
                        title="Xóa sản phẩm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </h4>
                    <div className="text-red-600 font-bold text-sm mt-1.5">{formatPrice(item.price)}</div>
                  </div>

                  <div className="flex items-center mt-2">
                    <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                      <button
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="w-7 h-7 flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        -
                      </button>
                      <span className="w-9 text-center text-xs font-bold border-x border-gray-300 flex items-center justify-center h-7 bg-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="w-7 h-7 flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CartPage;