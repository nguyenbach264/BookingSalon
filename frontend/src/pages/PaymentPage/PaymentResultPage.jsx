import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, ShoppingBag, ArrowRight, Clock, RotateCcw, ChevronRight } from 'lucide-react';

/**
 * PaymentResultPage — Trang kết quả thanh toán VNPay
 * Design A: Minimalist Digital Receipt
 * VNPay redirect về đây sau khi người dùng hoàn tất thanh toán (cả thành công lẫn thất bại)
 * URL: /payment/result?responseCode=00&txnRef=ORDxxxxxxxx&amount=xxxxxx&orderInfo=...
 */
const VNPAY_RESPONSE_CODES = {
  '00': 'Thanh toán thành công',
  '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
  '09': 'Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng',
  '10': 'Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
  '11': 'Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch',
  '12': 'Thẻ/Tài khoản của khách hàng bị khóa',
  '13': 'Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch',
  '24': 'Khách hàng hủy giao dịch',
  '51': 'Tài khoản của quý khách không đủ số dư để thực hiện giao dịch',
  '65': 'Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày',
  '75': 'Ngân hàng thanh toán đang bảo trì',
  '79': 'KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch',
  '99': 'Lỗi không xác định. Vui lòng liên hệ hỗ trợ',
};

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  const responseCode = searchParams.get('responseCode') || searchParams.get('vnp_ResponseCode') || '99';
  const txnRef = searchParams.get('txnRef') || searchParams.get('vnp_TxnRef') || '';
  const amountRaw = searchParams.get('amount') || searchParams.get('vnp_Amount') || '0';
  const orderInfo = searchParams.get('orderInfo') || searchParams.get('vnp_OrderInfo') || '';

  const isSuccess = responseCode === '00';
  // VNPay trả về amount * 100, chia lại để lấy số tiền thật nếu cần
  const rawNum = parseInt(amountRaw, 10) || 0;
  const amount = rawNum > 5000000 && rawNum % 100 === 0 ? rawNum / 100 : rawNum;

  const formatPrice = (val) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

  const errorMessage = VNPAY_RESPONSE_CODES[responseCode] || VNPAY_RESPONSE_CODES['99'];

  // Auto redirect sau 10 giây nếu thành công
  useEffect(() => {
    if (!isSuccess) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/my-orders');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSuccess, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* ── Main Card ─────────────────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

          {/* Status Header */}
          <div className={`px-8 py-10 text-center border-b border-gray-100 ${
            isSuccess
              ? 'bg-gradient-to-b from-green-50 to-white'
              : 'bg-gradient-to-b from-red-50 to-white'
          }`}>
            {/* Icon */}
            <div className={`w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center ${
              isSuccess ? 'bg-green-100 ring-8 ring-green-50' : 'bg-red-100 ring-8 ring-red-50'
            }`}>
              {isSuccess ? (
                <CheckCircle2 size={42} className="text-green-600" strokeWidth={1.5} />
              ) : (
                <XCircle size={42} className="text-red-500" strokeWidth={1.5} />
              )}
            </div>

            <h1 className={`text-2xl font-black mb-2 ${isSuccess ? 'text-gray-900' : 'text-gray-900'}`}>
              {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
            </h1>
            <p className={`text-sm font-medium ${isSuccess ? 'text-green-600' : 'text-red-500'}`}>
              {isSuccess
                ? 'Đơn hàng của bạn đã được xác nhận và đang được xử lý'
                : errorMessage}
            </p>

            {/* Amount — prominent display for success */}
            {isSuccess && amount > 0 && (
              <div className="mt-5 inline-flex flex-col items-center bg-green-50 border border-green-200 px-6 py-3 rounded-2xl">
                <span className="text-xs text-green-600 font-semibold uppercase tracking-wider mb-1">Số tiền giao dịch</span>
                <span className="text-3xl font-black text-green-700">{formatPrice(amount)}</span>
              </div>
            )}
          </div>

          {/* Transaction Details */}
          <div className="px-6 py-5 space-y-0 divide-y divide-gray-100">
            {txnRef && (
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-500">Mã giao dịch</span>
                <span className="font-mono font-bold text-gray-900 text-xs bg-gray-100 px-2.5 py-1 rounded-lg">
                  {txnRef}
                </span>
              </div>
            )}
            {!isSuccess && amount > 0 && (
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-500">Số tiền</span>
                <span className="font-bold text-gray-800">{formatPrice(amount)}</span>
              </div>
            )}
            {orderInfo && (
              <div className="flex items-start justify-between py-3 gap-4">
                <span className="text-sm text-gray-500 shrink-0">Nội dung</span>
                <span className="font-medium text-gray-700 text-right text-sm max-w-[200px] leading-snug">
                  {orderInfo}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-gray-500">Trạng thái</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                isSuccess
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-600'
              }`}>
                {isSuccess ? '✓ Thành công' : `✗ Lỗi ${responseCode}`}
              </span>
            </div>
          </div>

          {/* VNPay Branding */}
          <div className="px-6 pb-2">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl py-2.5">
              <span>Thanh toán qua</span>
              <span className="font-black text-[#005BAC] text-sm">VNPay</span>
              <span>— Cổng thanh toán điện tử uy tín</span>
            </div>
          </div>

          {/* Auto-redirect countdown */}
          {isSuccess && (
            <div className="px-6 pb-4">
              <div className="flex items-center justify-center gap-2 text-xs text-[#60a5fa] bg-blue-50 border border-blue-100 py-2.5 px-4 rounded-xl">
                <Clock size={13} />
                <span>
                  Tự động chuyển về đơn hàng sau{' '}
                  <strong className="font-black">{countdown}</strong> giây...
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="px-6 pb-6 space-y-2.5">
            <button
              onClick={() => navigate('/my-orders')}
              className={`w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] ${
                isSuccess
                  ? 'bg-[#60a5fa] hover:bg-[#3b82f6] text-white shadow-md shadow-blue-200'
                  : 'bg-gray-900 hover:bg-gray-800 text-white'
              }`}
            >
              <ShoppingBag size={17} />
              {isSuccess ? 'Xem đơn hàng của tôi' : 'Xem đơn hàng & thử lại'}
              <ArrowRight size={15} />
            </button>

            {!isSuccess && (
              <button
                onClick={() => navigate('/checkout')}
                className="w-full h-11 rounded-2xl font-semibold text-sm border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw size={14} />
                Quay lại thanh toán
              </button>
            )}

            <button
              onClick={() => navigate('/shop')}
              className="w-full text-gray-400 hover:text-gray-600 text-xs font-medium transition-colors py-1 cursor-pointer"
            >
              Tiếp tục mua sắm →
            </button>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-5 leading-relaxed">
          Gặp vấn đề? Liên hệ hỗ trợ qua hotline hoặc email của BachBarber Salon
        </p>
      </div>
    </div>
  );
}
