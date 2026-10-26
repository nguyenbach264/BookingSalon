import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  CalendarCheck,
  MapPin,
  User,
  Home,
  PlusCircle,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { useBooking } from '../../service/context/BookingContext';

export function CheckoutSuccessfully({ onGoBack }) {
  const {
    selectedSalon,
    selectedStylist,
    selectedDate,
    selectedTime,
    selectedServices,
    createdBooking,
    paymentMethod,
    resetBooking,
  } = useBooking();

  const navigate = useNavigate();

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const totalAmount = selectedServices.reduce(
    (sum, item) => sum + (Number(item.price) || 0),
    0
  );

  const bookingCode =
    createdBooking?.bookingCode ||
    (createdBooking?.id ? `BB-${String(createdBooking.id).slice(0, 8).toUpperCase()}` : 'BB-2026-88888');

  const handleReturnHome = () => {
    resetBooking();
    if (onGoBack) {
      onGoBack();
    } else {
      navigate('/');
    }
  };

  const handleBookAnother = () => {
    resetBooking();
  };

  return (
    <div className="animate-fade-in py-10 px-4 max-w-[700px] mx-auto text-center pb-20">
      {/* Success Badge */}
      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4 shadow-sm ring-8 ring-green-50/50">
        <CheckCircle2 className="w-11 h-11 stroke-[2.2]" />
      </div>

      <div className="inline-flex items-center gap-1.5 text-[#2563eb] bg-blue-50 px-3 py-1 rounded-full text-xs font-bold mb-2">
        <Sparkles size={13} className="text-[#60a5fa]" /> Đã xác nhận lịch hẹn
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
        ĐẶT LỊCH THÀNH CÔNG!
      </h1>
      <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto leading-relaxed">
        Cảm ơn bạn đã lựa chọn BachBarber. Chúng tôi đã ghi nhận lịch hẹn và nhân viên sẽ sẵn sàng phục vụ bạn đúng giờ.
      </p>

      {/* Booking Code Card */}
      <div className="bg-gradient-to-r from-slate-900 via-[#1b2a4a] to-slate-900 text-white rounded-3xl p-6 mb-6 shadow-xl text-left relative overflow-hidden border border-slate-800">
        <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-[#60a5fa]/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative z-10">
          <div>
            <span className="text-[11px] text-[#93c5fd] uppercase font-bold tracking-wider">
              Mã đặt lịch của bạn
            </span>
            <p className="text-2xl sm:text-3xl font-black tracking-wider text-white mt-1">
              {bookingCode}
            </p>
          </div>
          <div className="sm:text-right">
            <span className="inline-block text-[11px] font-bold bg-green-500/20 text-green-300 border border-green-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
              ✓ Đã xác nhận
            </span>
            <p className="text-xs text-blue-200 mt-1">
              {paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản (Đã thanh toán)' : 'Thanh toán trực tiếp tại Salon'}
            </p>
          </div>
        </div>
      </div>

      {/* Booking Detail Summary Card */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-6 text-left mb-8 relative">
        <h3 className="font-extrabold text-base text-gray-900 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-[#60a5fa]" />
          Chi tiết lịch hẹn
        </h3>

        <div className="space-y-4 text-sm">
          {/* Salon */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-gray-900">
                {selectedSalon?.salonName || selectedSalon?.name || 'BachBarber Salon'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{selectedSalon?.address}</p>
            </div>
          </div>

          {/* Time & Date */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center shrink-0 mt-0.5">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-gray-900">
                {selectedTime} • {selectedDate}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Vui lòng đến trước 5-10 phút để được phục vụ chu đáo nhất</p>
            </div>
          </div>

          {/* Stylist */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-gray-900">
                {selectedStylist?.fullName || selectedStylist?.nickname || 'Stylist chỉ định'}
              </p>
              <p className="text-xs text-amber-600 font-semibold mt-0.5">
                {selectedStylist?.levelRank || 'Top Stylist'}
              </p>
            </div>
          </div>
        </div>

        {/* Services List */}
        <div className="mt-5 pt-4 border-t border-dashed border-gray-200">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2.5">
            Dịch vụ đã đặt ({selectedServices.length}):
          </p>
          <div className="space-y-2 mb-4">
            {selectedServices.map((s) => (
              <div key={s.id} className="flex justify-between text-xs text-gray-700 py-0.5">
                <span>• {s.name}</span>
                <span className="font-bold text-gray-900">{formatPrice(s.price)}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
            <span className="font-bold text-sm text-gray-800">Tổng chi phí:</span>
            <span className="text-xl font-black text-[#60a5fa]">{formatPrice(totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleReturnHome}
          className="w-full sm:w-auto px-8 py-3.5 bg-[#60a5fa] hover:bg-[#3b82f6] text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <Home className="w-4 h-4" />
          Về trang chủ
        </button>

        <button
          type="button"
          onClick={handleBookAnother}
          className="w-full sm:w-auto px-8 py-3.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-[#2563eb]" />
          Đặt thêm lịch mới
        </button>
      </div>
    </div>
  );
}