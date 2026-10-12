import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  Building2,
  Smartphone,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Copy,
  Check,
  Lock,
  RefreshCw,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { Button, Input, message, Tabs, Spin, Alert } from 'antd';
import axios from 'axios';

// Danh sách ngân hàng giả lập phong phú
const MOCK_BANKS = [
  { code: 'NCB', name: 'Ngân hàng NCB (Mặc định Sandbox)', short: 'NCB', color: 'bg-blue-600' },
  { code: 'VCB', name: 'Vietcombank', short: 'VCB', color: 'bg-emerald-600' },
  { code: 'TCB', name: 'Techcombank', short: 'TCB', color: 'bg-red-600' },
  { code: 'CTG', name: 'VietinBank', short: 'Vietin', color: 'bg-blue-700' },
  { code: 'BIDV', name: 'BIDV', short: 'BIDV', color: 'bg-teal-600' },
  { code: 'MB', name: 'MB Bank (Quân đội)', short: 'MB', color: 'bg-indigo-600' },
  { code: 'AGB', name: 'Agribank', short: 'Agri', color: 'bg-amber-700' },
  { code: 'ACB', name: 'Á Châu (ACB)', short: 'ACB', color: 'bg-blue-500' },
  { code: 'VPB', name: 'VPBank', short: 'VPB', color: 'bg-green-600' },
  { code: 'TPB', name: 'TPBank', short: 'TPB', color: 'bg-purple-600' },
  { code: 'STB', name: 'Sacombank', short: 'STB', color: 'bg-sky-700' },
  { code: 'HDB', name: 'HDBank', short: 'HDB', color: 'bg-yellow-600' },
];

export default function VnPaySandboxSimulatorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Params từ VNPay redirect URL
  const vnp_TxnRef = searchParams.get('vnp_TxnRef') || '';
  const vnp_AmountRaw = searchParams.get('vnp_Amount') || '0';
  const vnp_OrderInfo = searchParams.get('vnp_OrderInfo') || `Thanh toan don hang ${vnp_TxnRef}`;
  const vnp_TmnCode = searchParams.get('vnp_TmnCode') || 'DEMOVNPAY';

  // Số tiền thật (VNPay chia 100)
  const amountNumber = parseInt(vnp_AmountRaw, 10) || 0;
  const amountVnd = amountNumber > 5000000 && amountNumber % 100 === 0 ? amountNumber / 100 : amountNumber;

  // State
  const [selectedBank, setSelectedBank] = useState('NCB');
  const [activeTab, setActiveTab] = useState('atm');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [countdown, setCountdown] = useState(900); // 15:00 phút
  const [orderExtra, setOrderExtra] = useState(null);

  // Form ATM Thẻ Test chuẩn Sandbox VNPAY
  const [cardNumber, setCardNumber] = useState('9704 1985 2619 1432');
  const [cardHolder, setCardHolder] = useState('NGUYEN VAN A');
  const [cardDate, setCardDate] = useState('07/15');
  const [cardOtp, setCardOtp] = useState('123456');

  // Lấy thêm chi tiết đơn hàng từ backend nếu có
  useEffect(() => {
    if (!vnp_TxnRef) return;
    const fetchInfo = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/api/v1/payments/simulator/order-info?txnRef=${encodeURIComponent(vnp_TxnRef)}`, {
          withCredentials: true,
        });
        if (res.data && res.data.type === 'ORDER') {
          setOrderExtra(res.data);
        }
      } catch (err) {
        console.warn('Could not fetch extra order info in simulator:', err);
      }
    };
    fetchInfo();
  }, [vnp_TxnRef]);

  // Bộ đếm ngược thời gian giao dịch
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatPrice = (val) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    message.success('Đã sao chép mã giao dịch!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Thực thi giao dịch giả lập
  const handleSimulatePayment = async (responseCode = '00', cardType = 'ATM') => {
    setLoading(true);
    setLoadingStep('Đang kết nối cổng thanh toán VNPay Sandbox...');

    try {
      await new Promise((r) => setTimeout(r, 400));
      setLoadingStep('Xác thực chữ ký điện tử HMAC-SHA512 & Thông tin ngân hàng...');

      const payload = {
        vnp_TxnRef: vnp_TxnRef,
        vnp_Amount: vnp_AmountRaw,
        vnp_OrderInfo: vnp_OrderInfo,
        vnp_ResponseCode: responseCode,
        vnp_BankCode: selectedBank,
        vnp_CardType: cardType,
      };

      await new Promise((r) => setTimeout(r, 400));
      setLoadingStep('Đồng bộ trạng thái đơn hàng vào hệ thống...');

      const response = await axios.post('http://localhost:8080/api/v1/payments/simulator/process', payload, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });

      await new Promise((r) => setTimeout(r, 400));

      if (response.data && response.data.redirectUrl) {
        window.location.href = response.data.redirectUrl;
      } else {
        // Fallback điều hướng trực tiếp trang kết quả
        navigate(`/payment/result?responseCode=${responseCode}&txnRef=${encodeURIComponent(vnp_TxnRef)}&amount=${vnp_AmountRaw}&orderInfo=${encodeURIComponent(vnp_OrderInfo)}`);
      }
    } catch (err) {
      console.error('Simulator payment execution error:', err);
      message.warning('Có lỗi kết nối máy chủ, đang điều hướng về trang kết quả thanh toán...');
      setTimeout(() => {
        navigate(`/payment/result?responseCode=${responseCode}&txnRef=${encodeURIComponent(vnp_TxnRef)}&amount=${vnp_AmountRaw}&orderInfo=${encodeURIComponent(vnp_OrderInfo)}`);
      }, 800);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f6f9] text-gray-800 flex flex-col items-center justify-start pb-12">
      {/* ── TOP HEADER VNPAY SANDBOX ─────────────────────────────── */}
      <header className="w-full bg-white border-b border-gray-200 shadow-xs py-3 px-4 md:px-8 sticky top-0 z-40">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo VNPAY */}
            <div className="flex items-center gap-1.5 font-black text-xl tracking-tight">
              <span className="text-[#005ba6]">VN</span>
              <span className="text-[#e11b22]">PAY</span>
              <span className="text-[10px] font-bold uppercase bg-amber-500 text-white px-2 py-0.5 rounded-md ml-1.5 shadow-xs">
                Sandbox
              </span>
            </div>
            <div className="hidden sm:block h-5 w-[1px] bg-gray-200 mx-1" />
            <span className="hidden sm:inline-block text-xs text-gray-500 font-medium">
              Cổng thanh toán điện tử mô phỏng
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-medium border border-emerald-200">
              <Lock size={12} />
              <span>SSL 256-bit Secure</span>
            </div>
            <Button
              size="small"
              type="text"
              icon={<ArrowLeft size={14} />}
              onClick={() => navigate('/checkout')}
              className="text-gray-500 hover:text-gray-800"
            >
              Quay lại shop
            </Button>
          </div>
        </div>
      </header>

      {/* ── BANNER MÔ PHỎNG SANDBOX ─────────────────────────────── */}
      <div className="w-full max-w-[1100px] mt-4 px-4">
        <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border border-amber-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900 flex items-center gap-2">
                <span>MÔI TRƯỜNG GIẢ LẬP VNPAY SANDBOX MẶC ĐỊNH</span>
                <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.2 rounded font-semibold">TESTING</span>
              </div>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                Giao dịch được mô phỏng trong sandbox nội bộ, không trừ tiền thật. Đơn hàng sẽ được kích hoạt trạng thái <strong>ĐÃ THANH TOÁN (PAID)</strong> và gửi thông báo tức thì.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-white/80 px-3 py-1.5 rounded-xl border border-amber-200/80 font-mono flex-shrink-0 self-end sm:self-auto">
            <Clock size={13} className="text-amber-600" />
            <span>Hết hạn trong: <strong className="text-amber-900">{formatCountdown(countdown)}</strong></span>
          </div>
        </div>
      </div>

      {/* ── NỘI DUNG CHÍNH (2 CỘT) ──────────────────────────────── */}
      <div className="w-full max-w-[1100px] mt-4 px-4 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* CỘT TRÁI: THÔNG TIN ĐƠN HÀNG (4 CỘT) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
            <div className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-2">
              Thông tin thanh toán
            </div>
            <div className="text-xs text-gray-500">Đơn vị thụ hưởng:</div>
            <div className="text-sm font-bold text-gray-900 mb-4">
              BachBarber Salon & Hair Care Shop
            </div>

            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 mb-4 text-center">
              <div className="text-xs text-blue-700 font-semibold mb-1">Số tiền thanh toán</div>
              <div className="text-2xl font-black text-[#005ba6]">
                {formatPrice(amountVnd)}
              </div>
            </div>

            <div className="space-y-3 text-xs border-t border-gray-100 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Mã giao dịch (TxnRef):</span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-gray-800 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                  <span>{vnp_TxnRef || 'ORD-DEMO'}</span>
                  <button
                    onClick={() => handleCopy(vnp_TxnRef)}
                    className="text-gray-400 hover:text-blue-600 transition"
                    title="Sao chép mã"
                  >
                    {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              {orderExtra?.orderCode && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Mã đơn hàng:</span>
                  <span className="font-bold text-gray-800">{orderExtra.orderCode}</span>
                </div>
              )}

              {orderExtra?.receiverName && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Người nhận:</span>
                  <span className="font-medium text-gray-800">{orderExtra.receiverName}</span>
                </div>
              )}

              <div className="flex justify-between items-start">
                <span className="text-gray-500">Nội dung:</span>
                <span className="font-medium text-gray-800 text-right max-w-[170px] leading-tight">
                  {vnp_OrderInfo}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Merchant Terminal:</span>
                <span className="font-mono text-gray-600">{vnp_TmnCode}</span>
              </div>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs text-xs text-gray-600 flex items-start gap-2.5">
            <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-gray-800">Thẻ test được cấp sẵn:</strong> Số thẻ và OTP thử nghiệm đã được điền tự động. Bạn chỉ cần bấm <strong>"Xác nhận thanh toán"</strong> để hoàn tất.
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: GIAO DIỆN THANH TOÁN (8 CỘT) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>Chọn phương thức thanh toán giả lập</span>
            </h2>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-5 gap-2">
              <button
                onClick={() => setActiveTab('atm')}
                className={`flex items-center gap-2 py-2.5 px-4 font-semibold text-xs border-b-2 transition ${
                  activeTab === 'atm'
                    ? 'border-[#005ba6] text-[#005ba6]'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Building2 size={15} />
                <span>Thẻ ATM / Tài khoản ngân hàng</span>
              </button>

              <button
                onClick={() => setActiveTab('qr')}
                className={`flex items-center gap-2 py-2.5 px-4 font-semibold text-xs border-b-2 transition ${
                  activeTab === 'qr'
                    ? 'border-[#005ba6] text-[#005ba6]'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <QrCode size={15} />
                <span>VNPAY-QR (Quét mã)</span>
              </button>

              <button
                onClick={() => setActiveTab('visa')}
                className={`flex items-center gap-2 py-2.5 px-4 font-semibold text-xs border-b-2 transition ${
                  activeTab === 'visa'
                    ? 'border-[#005ba6] text-[#005ba6]'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <CreditCard size={15} />
                <span>Thẻ quốc tế (Visa/Master)</span>
              </button>
            </div>

            {/* TAB CONTENT: ATM & TÀI KHOẢN NỘI ĐỊA */}
            {activeTab === 'atm' && (
              <div className="space-y-5">
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-2">
                    1. Chọn ngân hàng phát hành thẻ:
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {MOCK_BANKS.map((bank) => (
                      <button
                        key={bank.code}
                        onClick={() => setSelectedBank(bank.code)}
                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                          selectedBank === bank.code
                            ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/30 font-bold text-blue-700 shadow-xs'
                            : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg ${bank.color} text-white font-black text-[11px] flex items-center justify-center shadow-xs`}>
                          {bank.short}
                        </div>
                        <span className="text-[11px] truncate w-full">{bank.code}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200">
                  <div className="text-xs font-semibold text-gray-700 mb-3 flex items-center justify-between">
                    <span>2. Thông tin thẻ thử nghiệm (Đã điền mẫu tự động):</span>
                    <span className="text-[11px] text-blue-600 font-normal">Ngân hàng đã chọn: <strong>{selectedBank}</strong></span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-gray-500 mb-1 font-medium">Số thẻ test</label>
                      <Input
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        prefix={<CreditCard size={14} className="text-gray-400" />}
                        className="h-10 rounded-lg font-mono font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-500 mb-1 font-medium">Tên chủ thẻ (không dấu)</label>
                      <Input
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="h-10 rounded-lg font-medium uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-500 mb-1 font-medium">Ngày phát hành (MM/YY)</label>
                      <Input
                        value={cardDate}
                        onChange={(e) => setCardDate(e.target.value)}
                        className="h-10 rounded-lg font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-500 mb-1 font-medium">Mã OTP xác thực</label>
                      <Input
                        value={cardOtp}
                        onChange={(e) => setCardOtp(e.target.value)}
                        className="h-10 rounded-lg font-mono font-bold text-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="pt-2">
                  <Button
                    type="primary"
                    block
                    size="large"
                    loading={loading}
                    onClick={() => handleSimulatePayment('00', 'ATM')}
                    className="h-12 rounded-xl font-bold text-sm bg-[#005ba6] hover:bg-blue-700 border-none shadow-md flex items-center justify-center gap-2"
                  >
                    <ShieldCheck size={18} />
                    <span>Xác nhận thanh toán {formatPrice(amountVnd)} qua {selectedBank}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: VNPAY-QR */}
            {activeTab === 'qr' && (
              <div className="flex flex-col items-center justify-center py-4 text-center space-y-4">
                <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-blue-300 shadow-sm inline-block">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`VNPAY-SANDBOX-TEST:${vnp_TxnRef}:${amountVnd}`)}`}
                    alt="VNPAY-QR Sandbox"
                    className="w-48 h-48 mx-auto object-contain"
                  />
                  <div className="text-[11px] font-mono font-bold text-gray-600 mt-2">
                    Mã QR Sandbox: {vnp_TxnRef}
                  </div>
                </div>

                <div className="text-xs text-gray-500 max-w-sm">
                  Quét mã qua Mobile Banking hoặc ví VNPAY. Trong môi trường Sandbox, bấm nút phía dưới để giả lập quét mã thành công.
                </div>

                <Button
                  type="primary"
                  size="large"
                  loading={loading}
                  onClick={() => handleSimulatePayment('00', 'QR')}
                  className="h-11 px-8 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 border-none shadow-md flex items-center justify-center gap-2"
                >
                  <QrCode size={18} />
                  <span>Mô phỏng Quét mã QR & Xác nhận thanh toán</span>
                </Button>
              </div>
            )}

            {/* TAB CONTENT: VISA / MASTER */}
            {activeTab === 'visa' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-md max-w-sm mx-auto">
                  <div className="flex justify-between items-center mb-6">
                    <span className="font-bold text-xs tracking-widest text-slate-400">VNPAY SANDBOX TEST CARD</span>
                    <span className="font-extrabold text-sm italic text-amber-400">VISA</span>
                  </div>
                  <div className="font-mono text-lg tracking-wider mb-4">
                    4000 0012 3456 7890
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-300 font-mono">
                    <span>NGUYEN VAN A</span>
                    <span>12/28</span>
                  </div>
                </div>

                <Button
                  type="primary"
                  block
                  size="large"
                  loading={loading}
                  onClick={() => handleSimulatePayment('00', 'VISA')}
                  className="h-12 rounded-xl font-bold text-sm bg-indigo-700 hover:bg-indigo-800 border-none shadow-md flex items-center justify-center gap-2"
                >
                  <CreditCard size={18} />
                  <span>Xác nhận thanh toán Thẻ Quốc tế {formatPrice(amountVnd)}</span>
                </Button>
              </div>
            )}
          </div>

          {/* ── SANDBOX TESTING CONTROL PANEL ───────────────────────── */}
          <div className="bg-white rounded-2xl p-5 border border-dashed border-amber-300 bg-amber-50/20 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-800 mb-1">
              <Sparkles size={15} className="text-amber-500" />
              <span>BẢNG ĐIỀU KHIỂN KIỂM THỬ SANDBOX (SIMULATION CONTROLS)</span>
            </div>
            <p className="text-[11px] text-gray-500 mb-3.5">
              Thử nghiệm các tình huống kết quả phản hồi của cổng VNPay đối với hệ thống Salon & Shop:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <Button
                type="primary"
                onClick={() => handleSimulatePayment('00')}
                loading={loading}
                className="h-10 rounded-xl font-bold text-xs bg-green-600 hover:bg-green-700 border-none flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                <span>Thành công (00)</span>
              </Button>

              <Button
                onClick={() => handleSimulatePayment('24')}
                loading={loading}
                className="h-10 rounded-xl font-bold text-xs border-red-300 text-red-600 hover:bg-red-50 flex items-center justify-center gap-1.5"
              >
                <XCircle size={14} />
                <span>Hủy giao dịch (24)</span>
              </Button>

              <Button
                onClick={() => handleSimulatePayment('51')}
                loading={loading}
                className="h-10 rounded-xl font-medium text-xs border-amber-300 text-amber-700 hover:bg-amber-50 flex items-center justify-center gap-1.5"
              >
                <AlertTriangle size={14} />
                <span>Thiếu số dư (51)</span>
              </Button>

              <Button
                onClick={() => handleSimulatePayment('11')}
                loading={loading}
                className="h-10 rounded-xl font-medium text-xs border-purple-300 text-purple-700 hover:bg-purple-50 flex items-center justify-center gap-1.5"
              >
                <Clock size={14} />
                <span>Hết hạn giờ (11)</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── PROCESSING OVERLAY SPINNER ───────────────────────────── */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl flex flex-col items-center">
            <Spin size="large" className="mb-4" />
            <h3 className="font-bold text-gray-900 text-base mb-1">Đang xử lý giao dịch Sandbox</h3>
            <p className="text-xs text-blue-600 font-medium animate-pulse">{loadingStep}</p>
            <div className="mt-4 text-[11px] text-gray-400">
              Vui lòng không đóng trình duyệt...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

