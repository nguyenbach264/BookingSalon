import React, { useState, useEffect } from 'react';
import { Input, Select, } from 'antd';
import { Search, X, User, Trash2, CalendarCheck, MapPin, Check, ArrowLeft, ChevronUp, ChevronDown, Calendar } from 'lucide-react';
import { useBooking } from '../../service/context/BookingContext';

export function Checkout() {
  const { step, setStep, selectedSalon, selectedStylist, selectedDate, selectedTime, selectedServices } = useBooking();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const totalServicePrice = selectedServices.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="animate-in fade-in duration-300 mt-8">
      <h2 className="text-xl font-bold mb-6">Thanh Toán / Xác nhận</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="font-bold text-gray-700 border-b pb-2">Thông tin người đặt</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
            <input type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nhập tên của bạn" value={customerName} onChange={e => setCustomerName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
            <input type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nhập SĐT" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
          </div>

          <h3 className="font-bold text-gray-700 border-b pb-2 mt-6">Phương thức thanh toán</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer bg-blue-50 border-blue-200">
              <input type="radio" name="payment" defaultChecked className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Thanh toán tại Salon (Tiền mặt / Quẹt thẻ)</span>
            </label>
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="radio" name="payment" className="w-4 h-4" />
              <span className="font-medium">Thanh toán MoMo</span>
            </label>
          </div>
        </div>

        <div>
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 sticky top-24">
            <h3 className="font-bold text-lg mb-4">Tóm tắt lịch đặt</h3>
            <div className="space-y-3 mb-4 text-sm">
              <div className="flex gap-2"><MapPin className="w-4 h-4 text-gray-500 shrink-0" /> <span><strong className="block text-gray-800">{selectedSalon.name}</strong> {selectedSalon.address}</span></div>
              <div className="flex gap-2"><Calendar className="w-4 h-4 text-gray-500 shrink-0" /> <span><strong>{selectedTime}</strong> - {selectedDate === 'today' ? 'Hôm nay' : selectedDate === 'tomorrow' ? 'Ngày mai' : 'Ngày kia'}</span></div>
              <div className="flex gap-2"><User className="w-4 h-4 text-gray-500 shrink-0" /> <span>Stylist: <strong>{selectedStylist.name}</strong></span></div>
            </div>
            <div className="border-t pt-4">
              <p className="font-bold text-sm mb-2">Dịch vụ ({selectedServices.length}):</p>
              <div className="space-y-2 mb-4">
                {selectedServices.map(s => (
                  <div key={s.id} className="flex justify-between text-sm text-gray-600">
                    <span>{s.name}</span>
                    <span>{s.price.toLocaleString()}đ</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-black text-lg text-[#1b2a4a] border-t pt-3">
                <span>Tổng cộng:</span>
                <span>{totalServicePrice.toLocaleString()}đ</span>
              </div>
            </div>
            <button disabled={!customerName || !customerPhone} onClick={() => setStep(5)} className="w-full mt-6 py-3.5 bg-[#1b2a4a] text-white font-bold rounded-xl hover:bg-blue-900 transition-colors disabled:opacity-50 text-lg shadow-lg">
              XÁC NHẬN ĐẶT LỊCH
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}