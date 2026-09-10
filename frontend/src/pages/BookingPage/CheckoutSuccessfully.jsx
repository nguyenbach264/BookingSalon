import React, { useState, useEffect } from 'react';
import { Input, Select, } from 'antd';
import { Search, X, User, Trash2, CalendarCheck, MapPin, Check, ArrowLeft, ChevronUp, ChevronDown, Calendar } from 'lucide-react';
import { useBooking } from '../../service/context/BookingContext';

const MOCK_STYLISTS = [
  { id: 'auto', name: '30Shine Chọn Giúp Anh', image: 'https://placehold.co/150x200/1b2a4a/ffffff?text=30Shine' },
  { id: 1, name: 'Hiển Nguyễn', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=200&fit=crop' },
  { id: 2, name: 'Tiến Trần', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=200&fit=crop' },
  { id: 3, name: 'Hiếu Nguyễn', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=200&fit=crop' },
];



export function CheckoutSuccessfully() {
  const { selectedSalon, selectedStylist, selectedDate, selectedTime, selectedServices } = useBooking();

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  const totalAmount = selectedServices.reduce((sum, item) => sum + item.price, 0);

  const onGoBack = () => {
    console.log('Go back to home page');
  }

  return (
    <div className="animate-fade-in py-12 flex flex-col items-center justify-center text-center max-w-[600px] mx-auto">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-6 shadow-sm">
        <Check className="w-10 h-10" />
      </div>

      <h2 className="text-3xl font-black text-gray-900 mb-2">ĐẶT LỊCH THÀNH CÔNG!</h2>
      <p className="text-gray-500 mb-8 text-lg">Mã đặt lịch của bạn là: <strong className="text-gray-900">#30S-{Math.floor(Math.random() * 90000) + 10000}</strong></p>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm w-full text-left mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-green-500"></div>
        <h3 className="font-bold text-lg border-b pb-3 mb-4 text-[#1b2a4a]">Thông tin chi tiết</h3>

        <div className="space-y-4 text-gray-700">
          <div className="flex items-start gap-3">
            <MapPin className="text-gray-400 mt-1 shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">{selectedSalon?.name}</p>
              <p className="text-sm">{selectedSalon?.address}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CalendarCheck className="text-gray-400 mt-1 shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">Thời gian cắt</p>
              <p className="text-sm">{selectedTime} - {selectedDate === 'today' ? 'Hôm nay' : selectedDate === 'tomorrow' ? 'Ngày mai' : 'Ngày kia'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="text-gray-400 mt-1 shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">Stylist phục vụ</p>
              <p className="text-sm">{MOCK_STYLISTS.find(s => s.id === selectedStylist)?.name}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-dashed border-gray-300">
          <p className="text-sm text-gray-500 mb-2">Các dịch vụ:</p>
          <ul className="list-disc list-inside text-sm font-medium">
            {selectedServices.map(s => <li key={s.id}>{s.name}</li>)}
          </ul>
          <div className="mt-4 pt-4 flex justify-between items-center">
            <span className="font-bold text-gray-800">Đã thanh toán:</span>
            <span className="text-xl font-black text-green-600">{formatPrice(totalAmount)}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onGoBack}
        className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-8 rounded-lg transition-colors"
      >
        Về trang chủ
      </button>
    </div>
  );
}