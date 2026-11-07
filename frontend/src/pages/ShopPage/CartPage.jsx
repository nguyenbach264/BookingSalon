import React from 'react';
import { Button, Modal } from 'antd';
import { ShoppingBag, Trash2, ArrowRight } from 'lucide-react';

const formatPrice = (price) => {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' đ';
};

const CartPage = ({ visible, onClose, cartItems, onUpdateQuantity, onRemoveItem, onCheckout }) => {
  const totalPrice = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  const modalFooter = cartItems.length > 0 ? (
    <div className="pt-4 mt-2 space-y-4 border-t border-gray-100">
      <div className="flex justify-between items-center text-sm px-1 text-gray-500">
        <span className="font-medium">Tạm tính:</span>
        <span className="font-bold text-gray-900 text-base">{formatPrice(totalPrice)}</span>
      </div>
      <div className="flex justify-between items-center text-base border-t border-dashed border-gray-200 pt-3 px-1">
        <span className="text-gray-900 font-extrabold uppercase text-sm">Tổng cộng:</span>
        <span className="font-black text-[#60a5fa] text-2xl">{formatPrice(totalPrice)}</span>
      </div>
      <button
        type="button"
        className="w-full h-12 bg-[#60a5fa] hover:bg-[#3b82f6] text-white font-bold text-sm rounded-xl shadow-md shadow-blue-200 transition-all uppercase tracking-wide flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
        onClick={onCheckout}
      >
        <span>Thanh Toán Ngay</span>
        <ArrowRight size={16} />
      </button>
    </div>
  ) : null;

  return (
    <Modal
      title={
        <div className="flex items-center justify-between pr-8">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#60a5fa]" />
            <span className="text-lg font-black text-gray-900">GIỎ HÀNG</span>
          </div>
          <span className="text-xs font-bold text-[#2563eb] bg-blue-50 px-2.5 py-1 rounded-full">
            {cartItems.length} sản phẩm
          </span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={modalFooter}
      centered
      width={680}
      className="font-sans rounded-2xl overflow-hidden"
    >
      <div className="max-h-[55vh] overflow-y-auto py-3 pr-1">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-3">
            <div className="w-20 h-20 bg-blue-50/50 rounded-2xl flex items-center justify-center text-[#60a5fa]">
              <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Giỏ hàng của bạn đang trống</p>
            <p className="text-xs text-gray-400">Hãy thêm sản phẩm chăm sóc tóc yêu thích vào giỏ hàng nhé!</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-5 py-2.5 rounded-xl bg-[#60a5fa] text-white text-xs font-bold hover:bg-[#3b82f6] shadow-sm transition-all cursor-pointer"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 border border-gray-100 bg-white p-3.5 rounded-2xl shadow-xs group hover:border-[#60a5fa]/40 transition-colors"
              >
                <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-gray-800 line-clamp-1 leading-snug">
                        {item.name}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-gray-400 hover:text-red-500 p-1 transition-colors rounded-lg cursor-pointer shrink-0"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-rose-600 font-black text-sm mt-1">
                      {formatPrice(item.price)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                    <span className="text-xs text-gray-400">Số lượng:</span>
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <button
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer text-sm font-bold"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-bold border-x border-gray-200 flex items-center justify-center h-7 bg-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer text-sm font-bold"
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