import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  CalendarCheck,
  MapPin,
  User,
  Clock,
  Home,
  PlusCircle,
  Receipt,
  CreditCard,
  Phone,
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
    <div className="animate-fade-in py-8 px-4 max-w-[680px] mx-auto text-center">
      {/* Success Badge */}
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-4 shadow-sm ring-8 ring-emerald-50">
        <CheckCircle2 className="w-11 h-11 stroke-[2.5]" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
        ĐẶT LỊCH THÀNH CÔNG!
      </h1>
      <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
        Cảm ơn bạn đã lựa chọn dịch vụ. Chúng tôi đã gửi thông tin xác nhận và lịch hẹn vào hệ thống.
      </p>

      {/* Booking Code Card */}
      <div className="bg-gradient-to-r from-[#1b2a4a] to-blue-900 text-white rounded-2xl p-5 mb-6 shadow-lg text-left relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
        <div className="flex justify-between items-center relative z-10">
          <div>
            <span className="text-xs text-blue-200 uppercase font-bold tracking-wider">
              Mã đặt lịch của bạn
            </span>
            <p className="text-2xl sm:text-3xl font-black tracking-wider text-amber-300 mt-0.5">
              {bookingCode}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold bg-emerald-500 text-white px-3 py-1 rounded-full uppercase tracking-wider">
              Đã xác nhận
            </span>
            <p className="text-xs text-blue-200 mt-1">
              {paymentMethod === 'BANK_TRANSFER' ? 'Đã thanh toán online' : 'Thanh toán tại Salon'}
            </p>
          </div>
        </div>
      </div>

      {/* Booking Detail Summary Card */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-6 text-left mb-8 relative">
        <h3 className="font-extrabold text-base text-gray-900 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-blue-600" />
          Chi tiết lịch hẹn
        </h3>

        <div className="space-y-4 text-sm">
          {/* Salon */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-gray-900">
                {selectedSalon?.salonName || selectedSalon?.name || 'Salon 30Shine'}
              </p>
              <p className="text-xs text-gray-500">{selectedSalon?.address}</p>
            </div>
          </div>

          {/* Time & Date */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-gray-900">
                {selectedTime} - {selectedDate}
              </p>
              <p className="text-xs text-gray-500">Vui lòng đến trước 5-10 phút để được phục vụ chu đáo nhất</p>
            </div>
          </div>

          {/* Stylist */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-gray-900">
                {selectedStylist?.fullName || selectedStylist?.nickname || 'Stylist chỉ định'}
              </p>
              <p className="text-xs text-amber-600 font-semibold">
                {selectedStylist?.levelRank || 'Top Stylist'}
              </p>
            </div>
          </div>
        </div>

        {/* Services List */}
        <div className="mt-5 pt-4 border-t border-dashed border-gray-200">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
            Dịch vụ đã đặt ({selectedServices.length}):
          </p>
          <div className="space-y-1.5 mb-4">
            {selectedServices.map((s) => (
              <div key={s.id} className="flex justify-between text-xs text-gray-700">
                <span>• {s.name}</span>
                <span className="font-bold text-gray-900">{formatPrice(s.price)}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
            <span className="font-bold text-sm text-gray-800">Tổng chi phí:</span>
            <span className="text-lg font-black text-rose-600">{formatPrice(totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleReturnHome}
          className="w-full sm:w-auto px-8 py-3 bg-[#1b2a4a] hover:bg-[#244383] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          Về trang chủ
        </button>

        <button
          type="button"
          onClick={handleBookAnother}
          className="w-full sm:w-auto px-8 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-4 h-4 text-blue-600" />
          Đặt thêm lịch mới
        </button>
      </div>
    </div>
  );
}