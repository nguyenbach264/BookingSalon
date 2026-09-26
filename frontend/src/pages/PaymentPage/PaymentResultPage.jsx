import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button, Result, Spin } from 'antd';
import { CheckCircle2, XCircle, ShoppingBag, ArrowRight, Clock } from 'lucide-react';

/**
 * PaymentResultPage — Trang kết quả thanh toán VNPay
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
  // VNPay trả về amount * 100, chia lại để lấy số tiền thật
  const amount = parseInt(amountRaw, 10) / 100;

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Status Header */}
          <div className={`p-8 text-center ${isSuccess ? 'bg-gradient-to-br from-green-50 to-emerald-50' : 'bg-gradient-to-br from-red-50 to-rose-50'}`}>
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${isSuccess ? 'bg-green-100' : 'bg-red-100'}`}>
              {isSuccess ? (
                <CheckCircle2 size={44} className="text-green-600" />
              ) : (
                <XCircle size={44} className="text-red-500" />
              )}
            </div>
            <h1 className={`text-2xl font-black mb-1 ${isSuccess ? 'text-green-700' : 'text-red-600'}`}>
              {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
            </h1>
            <p className={`text-sm ${isSuccess ? 'text-green-600' : 'text-red-500'}`}>
              {isSuccess ? 'Đơn hàng của bạn đã được xác nhận và đang được xử lý' : errorMessage}
            </p>
          </div>

          {/* Payment Details */}
          <div className="p-6 space-y-4">
            {/* Transaction Info */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3 text-sm">
              {txnRef && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Mã giao dịch:</span>
                  <span className="font-mono font-bold text-gray-800 text-xs">{txnRef}</span>
                </div>
              )}
              {amount > 0 && (
                <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                  <span className="text-gray-500">Số tiền:</span>
                  <span className={`font-extrabold text-lg ${isSuccess ? 'text-green-600' : 'text-gray-700'}`}>
                    {formatPrice(amount)}
                  </span>
                </div>
              )}
              {orderInfo && (
                <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                  <span className="text-gray-500">Nội dung:</span>
                  <span className="font-medium text-gray-700 text-right max-w-[200px] text-xs">{orderInfo}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                <span className="text-gray-500">Trạng thái:</span>
                <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                  isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}>
                  {isSuccess ? '✓ Thành công' : `✗ Lỗi ${responseCode}`}
                </span>
              </div>
            </div>

            {/* VNPay Branding */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <span>Thanh toán qua</span>
              <span className="font-bold text-blue-600 text-sm">VNPay</span>
              <span>— Cổng thanh toán điện tử uy tín</span>
            </div>

            {/* Auto redirect notice */}
            {isSuccess && (
              <div className="flex items-center justify-center gap-2 text-xs text-blue-600 bg-blue-50 py-2.5 px-4 rounded-xl">
                <Clock size={14} />
                <span>Tự động chuyển về đơn hàng sau <strong>{countdown}</strong> giây...</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-6 pb-6 space-y-2.5">
            <Button
              type="primary"
              block
              size="large"
              onClick={() => navigate('/my-orders')}
              className={`h-12 rounded-2xl font-bold text-sm border-none flex items-center justify-center gap-2 ${
                isSuccess
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-[#1b2a4a] hover:bg-blue-900'
              }`}
            >
              <ShoppingBag size={18} />
              {isSuccess ? 'Xem đơn hàng của tôi' : 'Xem đơn hàng & thử lại'}
              <ArrowRight size={16} />
            </Button>

            {!isSuccess && (
              <Button
                block
                size="large"
                onClick={() => navigate('/checkout')}
                className="h-11 rounded-2xl font-semibold text-sm border-gray-200"
              >
                ← Quay lại thanh toán
              </Button>
            )}

            <Button
              type="link"
              block
              onClick={() => navigate('/shop')}
              className="text-gray-400 text-xs"
            >
              Tiếp tục mua sắm
            </Button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Gặp vấn đề? Liên hệ hỗ trợ qua hotline hoặc email của BachBarber Salon
        </p>
      </div>
    </div>
  );
}

