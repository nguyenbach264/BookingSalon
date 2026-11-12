import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gift,
  Copy,
  Check,
  Clock,
  Sparkles,
  ArrowRight,
  Tag,
  Scissors,
  ShoppingBag,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { message, Skeleton } from 'antd';
import { getAvailableVouchers } from '../../service/api/voucherApi';
import dayjs from 'dayjs';

export default function PromotionsPage() {
  const navigate = useNavigate();

  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');

  const fetchVouchersFromDb = () => {
    setLoading(true);
    setError(null);
    getAvailableVouchers()
      .then((data) => {
        if (Array.isArray(data)) {
          setVouchers(data);
        } else {
          setVouchers([]);
        }
      })
      .catch((err) => {
        console.error("Lỗi khi tải voucher từ database:", err);
        setError("Không thể kết nối đến máy chủ để tải danh sách ưu đãi & voucher.");
        message.error("Lỗi khi tải dữ liệu voucher từ cơ sở dữ liệu!");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVouchersFromDb();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    message.success(`Đã sao chép mã ưu đãi: ${code}!`);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2500);
  };

  const formatCurrency = (val) => {
    if (val == null) return '0';
    return Number(val).toLocaleString('vi-VN');
  };

  const filteredVouchers = vouchers.filter((v) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'PERCENT') return v.discountType === 'PERCENT';
    if (activeTab === 'FIXED') return v.discountType === 'FIXED_AMOUNT';
    return true;
  });

  return (
    <div className="w-full bg-slate-50 min-h-screen py-8 font-sans">
      <div className="max-w-[1280px] mx-auto px-4">
        
        {/* Breadcrumb & Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <span className="hover:text-slate-600 cursor-pointer" onClick={() => navigate('/')}>Trang chủ</span>
            <span>/</span>
            <span className="text-slate-700 font-semibold">Ưu đãi & Voucher</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-bold mb-2">
                <Sparkles size={14} className="text-amber-500" />
                <span>Kho Mã Giảm Giá Hệ Thống ({vouchers.length} mã đang hoạt động từ DB)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight">
                Ưu Đãi & Đặc Quyền Khách Hàng
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                Sao chép mã voucher áp dụng trực tiếp khi thanh toán đơn đặt lịch dịch vụ hoặc mua sắm mỹ phẩm tại salon.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 bg-white p-1 rounded-full border border-slate-200 shadow-2xs self-start md:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeTab === 'ALL'
                    ? 'text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                style={activeTab === 'ALL' ? { backgroundColor: 'var(--primary-color, #0099FF)' } : {}}
              >
                Tất cả ({vouchers.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('PERCENT')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeTab === 'PERCENT'
                    ? 'text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                style={activeTab === 'PERCENT' ? { backgroundColor: 'var(--primary-color, #0099FF)' } : {}}
              >
                Giảm theo %
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('FIXED')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeTab === 'FIXED'
                    ? 'text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                style={activeTab === 'FIXED' ? { backgroundColor: 'var(--primary-color, #0099FF)' } : {}}
              >
                Giảm tiền mặt
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center max-w-md mx-auto mb-8">
            <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 mb-1">Lỗi tải dữ liệu Voucher</h3>
            <p className="text-xs text-slate-600 mb-4">{error}</p>
            <button
              onClick={fetchVouchersFromDb}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-bold text-xs shadow-xs"
              style={{ backgroundColor: 'var(--primary-color, #0099FF)' }}
            >
              <RefreshCw size={14} />
              <span>Tải lại</span>
            </button>
          </div>
        )}

        {/* Vouchers Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
                <Skeleton active paragraph={{ rows: 4 }} />
              </div>
            ))}
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto">
            <Gift size={48} className="text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 mb-1">Hiện chưa có voucher phù hợp</h3>
            <p className="text-xs text-slate-500 mb-4">Các chương trình ưu đãi mới đang được cập nhật thường xuyên. Vui lòng quay lại sau.</p>
            <button
              onClick={() => setActiveTab('ALL')}
              className="text-xs font-bold text-[#0099FF] cursor-pointer"
              style={{ color: 'var(--primary-color, #0099FF)' }}
            >
              Xem tất cả ({vouchers.length}) ưu đãi
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVouchers.map((item) => {
              const isPercent = item.discountType === 'PERCENT';
              const discountLabel = isPercent
                ? `GIẢM ${Math.round(item.discountValue)}%`
                : `GIẢM ${formatCurrency(item.discountValue)}đ`;
              const maxDiscountText = item.maxDiscountAmount
                ? `Tối đa ${formatCurrency(item.maxDiscountAmount)}đ`
                : null;
              const minSpendText = item.minOrderAmount
                ? `Đơn từ ${formatCurrency(item.minOrderAmount)}đ`
                : 'Mọi đơn hàng';
              const expiryText = item.endDate
                ? dayjs(item.endDate).format('DD/MM/YYYY')
                : 'Không thời hạn';
              const isCopied = copiedCode === item.voucherCode;

              return (
                <div
                  key={item.id || item.voucherCode}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative"
                >
                  {/* Decorative top strip with primary brand color */}
                  <div
                    className="h-2 w-full"
                    style={{ backgroundColor: 'var(--primary-color, #0099FF)' }}
                  />

                  <div className="p-6">
                    {/* Header info */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-xs shadow-xs"
                          style={{ backgroundColor: 'var(--primary-color, #0099FF)' }}
                        >
                          <Gift size={20} />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            {isPercent ? 'Giảm Giá %' : 'Giảm Tiền Mặt Trực Tiếp'}
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            Hạn dùng: {expiryText}
                          </span>
                        </div>
                      </div>

                      <span
                        className="px-2.5 py-1 rounded-xl text-xs font-black text-white shrink-0 shadow-2xs"
                        style={{ backgroundColor: 'var(--primary-color, #0099FF)' }}
                      >
                        {discountLabel}
                      </span>
                    </div>

                    {/* Voucher Title & Description */}
                    <h3 className="text-base font-black text-slate-900 mb-2 leading-snug group-hover:text-[#0099FF] transition-colors">
                      {item.voucherName}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed line-clamp-2">
                      {item.description || 'Ưu đãi dành cho tất cả quý khách hàng khi đặt lịch dịch vụ hoặc mua sắm.'}
                    </p>

                    {/* Voucher Conditions / Details */}
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 mb-4 space-y-1.5 text-[11px] text-slate-600">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Điều kiện:</span>
                        <span className="font-semibold text-slate-800">{minSpendText}</span>
                      </div>
                      {maxDiscountText && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Mức giảm tối đa:</span>
                          <span className="font-semibold text-slate-800">{maxDiscountText}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Lượt đã dùng:</span>
                        <span className="font-semibold text-slate-800">
                          {item.usedCount || 0} / {item.usageLimitTotal || 'Không giới hạn'}
                        </span>
                      </div>
                    </div>

                    {/* Coupon Code Pill */}
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-2.5 flex items-center justify-between bg-slate-50/70 group-hover:border-[#0099FF]/50 transition-colors">
                      <div className="flex items-center gap-2 pl-2">
                        <Tag size={15} className="text-[#0099FF]" style={{ color: 'var(--primary-color, #0099FF)' }} />
                        <span className="font-mono text-sm font-black tracking-wider text-slate-900">
                          {item.voucherCode}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(item.voucherCode)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white text-slate-700 hover:text-white border border-slate-200'
                        }`}
                        style={!isCopied ? {} : {}}
                        onMouseEnter={(e) => {
                          if (!isCopied) {
                            e.currentTarget.style.backgroundColor = 'var(--primary-color, #0099FF)';
                            e.currentTarget.style.color = '#fff';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isCopied) {
                            e.currentTarget.style.backgroundColor = '#fff';
                            e.currentTarget.style.color = '#334155';
                          }
                        }}
                      >
                        {isCopied ? <Check size={13} /> : <Copy size={13} />}
                        <span>{isCopied ? 'Đã Lưu' : 'Sao Chép'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Card Footer Action */}
                  <div className="p-6 pt-0">
                    <button
                      type="button"
                      onClick={() => navigate('/booking', { state: { appliedVoucher: item.voucherCode } })}
                      className="w-full py-2.5 rounded-2xl text-xs font-bold text-white transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      style={{ backgroundColor: 'var(--primary-color, #0099FF)' }}
                    >
                      <span>Đặt Lịch Áp Dụng Ngay</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
