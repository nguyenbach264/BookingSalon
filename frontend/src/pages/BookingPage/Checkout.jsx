import React, { useState, useEffect, useMemo } from 'react';
import { Spin } from 'antd';
import {
  MapPin,
  Calendar,
  User,
  Clock,
  CreditCard,
  Banknote,
  QrCode,
  ShieldCheck,
  ChevronLeft,
  CheckCircle2,
  FileText,
  Phone,
  Mail,
  AlertCircle,
  Gift,
  Tag,
  Check,
  X,
} from 'lucide-react';
import { useBooking } from '../../service/context/BookingContext';
import { useAuth } from '../../auth/authProvider';
import { createBooking } from '../../service/api/bookingApi';
import { getAvailableVouchers, applyVoucher } from '../../service/api/voucherApi';
import { TopCenterNotificationModal } from '../components/TopCenterNotificationModal';

export function Checkout() {
  const {
    setStep,
    selectedSalon,
    selectedStylist,
    selectedDate,
    selectedTime,
    selectedServices,
    customerNotes,
    setCustomerNotes,
    paymentMethod,
    setPaymentMethod,
    setCreatedBooking,
  } = useBooking();

  const { userInfo, authenticated, openLoginModal } = useAuth();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Voucher states
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);

  // Top-center notification modal state (avoids any layout shift / jitter)
  const [notification, setNotification] = useState({
    isOpen: false,
    type: 'info', // 'success' | 'error' | 'warning' | 'info'
    title: '',
    message: '',
    primaryActionText: null,
    onPrimaryAction: null,
  });

  // Pre-fill user information from Auth Context
  useEffect(() => {
    if (userInfo) {
      if (userInfo.fullName) setCustomerName(userInfo.fullName);
      else if (userInfo.username) setCustomerName(userInfo.username);
      if (userInfo.phoneNumber) setCustomerPhone(userInfo.phoneNumber);
      if (userInfo.email) setCustomerEmail(userInfo.email);
    }
  }, [userInfo]);

  // Load available vouchers for this user
  useEffect(() => {
    getAvailableVouchers(userInfo?.id)
      .then((data) => {
        setAvailableVouchers(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.warn('Could not load available vouchers:', err);
      });
  }, [userInfo?.id]);

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

  const totalServicePrice = useMemo(() => {
    return selectedServices.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  }, [selectedServices]);

  const totalDuration = useMemo(() => {
    return selectedServices.reduce((sum, item) => sum + (Number(item.duration) || 30), 0);
  }, [selectedServices]);

  // Calculate discount and final amount
  const discountAmount = useMemo(() => {
    return appliedVoucher?.discountAmount ? Number(appliedVoucher.discountAmount) : 0;
  }, [appliedVoucher]);

  const finalPaymentPrice = useMemo(() => {
    return Math.max(0, totalServicePrice - discountAmount);
  }, [totalServicePrice, discountAmount]);

  // Format date display
  const formattedDateDisplay = useMemo(() => {
    if (!selectedDate) return '';
    try {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return selectedDate;
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Handle applying a voucher code
  const handleApplyVoucher = async (codeToApply) => {
    const code = (codeToApply || voucherCodeInput).trim().toUpperCase();
    if (!code) {
      setNotification({
        isOpen: true,
        type: 'warning',
        title: 'Chưa nhập mã ưu đãi',
        message: 'Vui lòng nhập mã voucher trước khi nhấn Áp dụng!',
      });
      return;
    }

    setApplyingVoucher(true);
    try {
      const res = await applyVoucher(code, totalServicePrice, userInfo?.id);
      if (res.valid) {
        setAppliedVoucher(res);
        setVoucherCodeInput(res.voucherCode);
        setVoucherModalOpen(false);
        setNotification({
          isOpen: true,
          type: 'success',
          title: 'Áp dụng Voucher thành công!',
          message: `Mã ${res.voucherCode} đã được áp dụng: Tiết kiệm ${formatPrice(res.discountAmount)} cho đơn đặt lịch này.`,
        });
      } else {
        setNotification({
          isOpen: true,
          type: 'error',
          title: 'Không thể áp dụng Voucher',
          message: res.message || 'Mã voucher không hợp lệ hoặc chưa thỏa mãn điều kiện áp dụng.',
        });
      }
    } catch (err) {
      console.error('Apply voucher error:', err);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Lỗi kiểm tra voucher',
        message: err.response?.data?.message || err.message || 'Không thể kiểm tra mã ưu đãi vào lúc này.',
      });
    } finally {
      setApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCodeInput('');
    setNotification({
      isOpen: true,
      type: 'info',
      title: 'Đã hủy voucher',
      message: 'Đã hủy mã ưu đãi khỏi đơn đặt lịch.',
    });
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!authenticated) {
      openLoginModal('Quý khách cần đăng nhập tài khoản để hoàn tất đặt lịch hẹn!', '/booking');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setNotification({
        isOpen: true,
        type: 'warning',
        title: 'Thiếu thông tin liên hệ',
        message: 'Vui lòng nhập đầy đủ Họ và tên cùng Số điện thoại để nhân viên salon đón tiếp bạn!',
      });
      return;
    }

    if (!selectedSalon || !selectedStylist || !selectedDate || !selectedTime) {
      setNotification({
        isOpen: true,
        type: 'warning',
        title: 'Thông tin chưa đầy đủ',
        message: 'Vui lòng kiểm tra lại thông tin chi nhánh, thợ cắt tóc và khung giờ hẹn!',
      });
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    // Build LocalDateTime ISO string: YYYY-MM-DDTHH:mm:ss
    const startTimeFormatted = `${selectedDate}T${selectedTime.length === 5 ? selectedTime + ':00' : selectedTime}`;

    // Get user ID
    const userId = userInfo?.id || '11111111-1111-1111-1111-111111111111';

    const payload = {
      salonId: selectedSalon.id,
      userId: userId,
      stylistId: selectedStylist.id,
      startTime: startTimeFormatted,
      serviceIds: selectedServices.map((s) => s.id),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || null,
      customerNotes: customerNotes.trim() || null,
      paymentMethod: paymentMethod, // 'CASH' | 'BANK_TRANSFER'
      voucherCode: appliedVoucher ? appliedVoucher.voucherCode : null,
    };

    try {
      const res = await createBooking(payload);
      setCreatedBooking(res);
      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Đặt lịch thành công!',
        message: `Mã lịch hẹn của bạn là ${res.bookingCode || 'BB-SALON'}. Hệ thống đã ghi nhận lịch hẹn và chuẩn bị sẵn sàng phục vụ bạn!`,
        primaryActionText: 'Xem thông tin lịch hẹn',
        onPrimaryAction: () => setStep(5),
      });

      // Tự động chuyển bước sau 1.5 giây nếu người dùng không bấm
      setTimeout(() => {
        setStep(5);
      }, 1800);
    } catch (err) {
      console.error('Create booking failed:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Không thể hoàn tất đặt lịch lúc này. Stylist có thể vừa được người khác đặt trước trong khung giờ này!';
      setErrorMessage(msg);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Đặt lịch không thành công',
        message: msg,
        primaryActionText: 'Chọn lại giờ khác',
        onPrimaryAction: () => setStep(2),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-6 animate-fade-in">
      {/* Top-Center Notification Modal (zero layout shift) */}
      <TopCenterNotificationModal
        isOpen={notification.isOpen}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        primaryActionText={notification.primaryActionText}
        onPrimaryAction={notification.onPrimaryAction}
        onClose={() => setNotification((prev) => ({ ...prev, isOpen: false }))}
        autoCloseDuration={notification.type === 'success' ? 2500 : 0}
      />

      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1b2a4a] tracking-tight">
          Xác nhận đặt lịch & Thanh toán
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Kiểm tra thông tin chi tiết và áp dụng voucher trước khi hoàn tất đặt lịch
        </p>
      </div>

      <form onSubmit={handleSubmitBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Customer info & Payment method */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Customer Details */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-sm">
            <h3 className="font-extrabold text-gray-900 text-base mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Thông tin người đặt hẹn
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                  placeholder="Nhập họ và tên của bạn"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                    placeholder="0912 345 678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Địa chỉ Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                    placeholder="email@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Ghi chú cho Stylist (tùy chọn)
                </label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all resize-none"
                  placeholder="Ví dụ: Cắt ngắn gọn gàng, sấy phồng tự nhiên, tóc yếu..."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Payment Method (Simulated) */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-sm">
            <h3 className="font-extrabold text-gray-900 text-base mb-1.5 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Phương thức thanh toán
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Chế độ giả lập thanh toán - Dữ liệu đơn đặt và giao dịch sẽ được cập nhật tự động vào hệ thống
            </p>

            <div className="space-y-3">
              {/* Option 1: Cash at Salon */}
              <label
                onClick={() => setPaymentMethod('CASH')}
                className={`flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'CASH'
                    ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-100'
                    : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50/50'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CASH"
                  checked={paymentMethod === 'CASH'}
                  onChange={() => setPaymentMethod('CASH')}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-sm text-gray-900">
                      Thanh toán tại Salon (Tiền mặt / Thẻ POS)
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Bạn sẽ thanh toán trực tiếp tại quầy thu ngân sau khi hoàn tất trải nghiệm dịch vụ.
                  </p>
                </div>
              </label>

              {/* Option 2: Bank Transfer (Simulated QR) */}
              <label
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                className={`flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-100'
                    : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50/50'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="BANK_TRANSFER"
                  checked={paymentMethod === 'BANK_TRANSFER'}
                  onChange={() => setPaymentMethod('BANK_TRANSFER')}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-sm text-gray-900">
                      Chuyển khoản Ngân hàng (Mô phỏng VietQR)
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      Tự động duyệt
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Mô phỏng thanh toán trực tuyến tức thì, hệ thống tự động ghi nhận thanh toán thành công (PAID).
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary Card */}
        <div className="lg:col-span-5">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-sm sticky top-24">
            <h3 className="font-extrabold text-base text-gray-900 mb-4 pb-3 border-b border-gray-100">
              Tóm tắt lịch hẹn
            </h3>

            {/* Salon Info */}
            <div className="flex items-start gap-3 mb-3.5 pb-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 font-medium">Chi nhánh Salon:</p>
                <p className="font-bold text-sm text-gray-900 truncate">
                  {selectedSalon?.salonName || selectedSalon?.name}
                </p>
                <p className="text-xs text-gray-500 line-clamp-1">{selectedSalon?.address}</p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-start gap-3 mb-3.5 pb-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Thời gian hẹn:</p>
                <p className="font-bold text-sm text-gray-900">
                  {selectedTime} - {formattedDateDisplay}
                </p>
                <p className="text-xs text-gray-500">Ước tính khoảng {totalDuration} phút</p>
              </div>
            </div>

            {/* Stylist */}
            <div className="flex items-start gap-3 mb-3.5 pb-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Stylist tạo kiểu:</p>
                <p className="font-bold text-sm text-gray-900">
                  {selectedStylist?.fullName || selectedStylist?.nickname || 'Stylist chỉ định'}
                </p>
                <p className="text-xs text-amber-600 font-semibold">
                  {selectedStylist?.levelRank || 'Top Stylist'}
                </p>
              </div>
            </div>

            {/* Services List */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold text-gray-500 uppercase">
                  Dịch vụ đã chọn ({selectedServices.length}):
                </p>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Thay đổi
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {selectedServices.map((s) => (
                  <div key={s.id} className="flex justify-between text-xs text-gray-600 py-0.5">
                    <span className="truncate pr-2">{s.name}</span>
                    <span className="font-bold text-gray-900 shrink-0">
                      {formatPrice(s.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* VOUCHER INPUT & SELECTION SECTION */}
            <div className="border-t border-gray-100 pt-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 uppercase tracking-wide">
                  <Gift className="w-4 h-4" />
                  <span>Ưu đãi & Voucher</span>
                </div>
                {availableVouchers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setVoucherModalOpen(true)}
                    className="text-xs font-bold text-purple-600 hover:text-purple-800 underline"
                  >
                    Chọn voucher ({availableVouchers.length})
                  </button>
                )}
              </div>

              {appliedVoucher ? (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-purple-600 shrink-0" />
                    <div>
                      <span className="font-mono font-bold text-xs text-purple-900 bg-purple-200 px-1.5 py-0.5 rounded">
                        {appliedVoucher.voucherCode}
                      </span>
                      <span className="text-xs font-semibold text-purple-800 ml-1.5">
                        - {formatPrice(appliedVoucher.discountAmount)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveVoucher}
                    className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                    title="Hủy voucher"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập mã ưu đãi..."
                    value={voucherCodeInput}
                    onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs uppercase font-mono font-bold focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-200 outline-none transition-all"
                  />
                  <button
                    type="button"
                    disabled={applyingVoucher || !voucherCodeInput.trim()}
                    onClick={() => handleApplyVoucher()}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                      applyingVoucher || !voucherCodeInput.trim()
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
                    }`}
                  >
                    {applyingVoucher ? 'Đang áp dụng...' : 'Áp dụng'}
                  </button>
                </div>
              )}
            </div>

            {/* Pricing Total */}
            <div className="border-t-2 border-dashed border-gray-200 pt-4 mb-6">
              <div className="flex justify-between items-center mb-1 text-sm text-gray-500">
                <span>Tạm tính ({selectedServices.length} dịch vụ):</span>
                <span>{formatPrice(totalServicePrice)}</span>
              </div>
              <div className="flex justify-between items-center mb-1 text-sm">
                <span className="text-gray-500">Khuyến mãi / Giảm giá:</span>
                <span className={`font-bold ${discountAmount > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {discountAmount > 0 ? `-${formatPrice(discountAmount)}` : '0đ'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 text-base sm:text-lg font-black text-gray-900">
                <span>Tổng thanh toán:</span>
                <span className="text-xl font-black text-rose-600">
                  {formatPrice(finalPaymentPrice)}
                </span>
              </div>
            </div>

            {/* Submit Button with Spinner & Disabled State (Requirement 4) */}
            <button
              type="submit"
              disabled={submitting || !customerName.trim() || !customerPhone.trim()}
              className={`w-full py-4 rounded-xl font-extrabold text-sm uppercase transition-all shadow-md flex items-center justify-center gap-2 select-none ${
                submitting || !customerName.trim() || !customerPhone.trim()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transform hover:scale-[1.01] active:scale-[0.99] shadow-blue-200'
              }`}
            >
              {submitting ? (
                <>
                  <Spin size="small" />
                  <span>Đang xử lý đặt lịch & thanh toán...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  <span>Xác nhận đặt lịch ngay</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => setStep(3)}
              className="w-full mt-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors flex items-center justify-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Quay lại bước chọn Dịch vụ
            </button>
          </div>
        </div>
      </form>

      {/* Available Vouchers Modal */}
      {voucherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 border border-gray-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-gray-900 text-base">Danh sách Voucher khả dụng</h3>
              </div>
              <button
                type="button"
                onClick={() => setVoucherModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {availableVouchers.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">
                Hiện không có mã voucher nào phù hợp.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {availableVouchers.map((v) => {
                  const isApplied = appliedVoucher?.voucherCode === v.voucherCode;
                  return (
                    <div
                      key={v.id || v.voucherCode}
                      className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${
                        isApplied
                          ? 'border-purple-600 bg-purple-50/50'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/20'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                            {v.voucherCode}
                          </span>
                          <span className="text-xs font-bold text-gray-900 truncate">
                            {v.voucherName}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1 mb-1">{v.description}</p>
                        <div className="text-[11px] text-gray-400 flex items-center gap-2">
                          <span className="text-rose-600 font-semibold">
                            {v.discountType === 'PERCENT'
                              ? `Giảm ${v.discountValue}%`
                              : `Giảm ${formatPrice(v.discountValue)}`}
                          </span>
                          {v.minOrderAmount > 0 && (
                            <span>• Đơn từ {formatPrice(v.minOrderAmount)}</span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={applyingVoucher}
                        onClick={() => handleApplyVoucher(v.voucherCode)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg shrink-0 transition-all ${
                          isApplied
                            ? 'bg-purple-100 text-purple-700 border border-purple-300'
                            : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
                        }`}
                      >
                        {isApplied ? 'Đang dùng' : 'Áp dụng'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setVoucherModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}