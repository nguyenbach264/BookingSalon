import React, { useState, useEffect, useMemo } from 'react';
import { Spin, message } from 'antd';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Clock,
  MapPin,
  Calendar,
  Star,
  Scissors,
  Trash2,
} from 'lucide-react';
import { useBooking } from '../../service/context/BookingContext';
import { getServiceOfferings } from '../../service/api/serviceApi';
import { applyVoucher } from '../../service/api/voucherApi';
import { DB_BASELINE_SERVICES, normalizeService } from '../../service/baselineServices';

export function SelectService() {
  const {
    setStep,
    selectedStylist,
    selectedServices,
    setSelectedServices,
    selectedSalon,
    selectedDate,
    selectedTime,
    appliedVoucher,
    setAppliedVoucher,
    voucherCodeInput,
    setVoucherCodeInput,
  } = useBooking();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  // Fetch full salon service offerings - đồng nhất 100% với ServicePage và Database
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getServiceOfferings(selectedSalon?.id)
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) && data.length > 0 ? data : DB_BASELINE_SERVICES;
        const normalized = list.map((s, idx) => normalizeService(s, idx));
        setServices(normalized);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Fallback to baseline service offerings:', err);
        if (isMounted) {
          const normalized = DB_BASELINE_SERVICES.map((s, idx) => normalizeService(s, idx));
          setServices(normalized);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSalon?.id]);

  // Kiểm tra xem dịch vụ có đang được chọn hay không (so sánh cả ID lẫn tên dịch vụ)
  const isServiceSelected = (srv) => {
    if (!srv) return false;
    return selectedServices.some((s) => {
      if (s.id && srv.id && String(s.id).toLowerCase() === String(srv.id).toLowerCase()) return true;
      if (s.name && srv.name && s.name.trim().toLowerCase() === srv.name.trim().toLowerCase()) return true;
      return false;
    });
  };

  const toggleService = (srv) => {
    if (srv.isSuspended) return;
    const exists = isServiceSelected(srv);
    if (exists) {
      setSelectedServices(
        selectedServices.filter(
          (s) =>
            String(s.id).toLowerCase() !== String(srv.id).toLowerCase() &&
            s.name?.trim().toLowerCase() !== srv.name?.trim().toLowerCase()
        )
      );
    } else {
      setSelectedServices([...selectedServices, srv]);
    }
  };

  const removeService = (srv) => {
    setSelectedServices(
      selectedServices.filter(
        (s) =>
          String(s.id).toLowerCase() !== String(srv.id).toLowerCase() &&
          s.name?.trim().toLowerCase() !== srv.name?.trim().toLowerCase()
      )
    );
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN').format(price || 0) + 'đ';

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return 'Thứ 7, 24/10';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const days = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      const dayName = days[d.getDay()];
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${dayName}, ${day}/${month}`;
    } catch {
      return dateStr;
    }
  };

  const totalAmount = useMemo(() => {
    return selectedServices.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  }, [selectedServices]);

  const discountAmount = useMemo(() => {
    return appliedVoucher?.discountAmount ? Number(appliedVoucher.discountAmount) : 0;
  }, [appliedVoucher]);

  const finalAmount = Math.max(0, totalAmount - discountAmount);

  // Voucher apply handler
  const handleApplyVoucher = async () => {
    if (!voucherCodeInput || !voucherCodeInput.trim()) {
      message.warning('Vui lòng nhập mã voucher!');
      return;
    }
    setApplyingVoucher(true);
    try {
      const result = await applyVoucher(voucherCodeInput.trim().toUpperCase(), totalAmount);
      if (result && result.isValid) {
        setAppliedVoucher(result);
        message.success(`Áp dụng voucher thành công! Giảm ${formatPrice(result.discountAmount)}`);
      } else {
        message.error(result?.message || 'Mã voucher không hợp lệ hoặc đã hết hạn');
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Không thể áp dụng mã voucher này!');
    } finally {
      setApplyingVoucher(false);
    }
  };

  const categories = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'Cắt tóc', label: 'Cắt tóc' },
    { key: 'Uốn/Nhuộm', label: 'Uốn/Nhuộm' },
    { key: 'Spa & Dưỡng sinh', label: 'Spa & Dưỡng sinh' },
  ];

  const filteredServices = useMemo(() => {
    if (categoryFilter === 'ALL') return services;
    return services.filter((s) => s.category === categoryFilter);
  }, [services, categoryFilter]);

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 pb-24 font-sans animate-fade-in">
      {/* ── Split-Screen Layout (Mockup: media_1791826614180_f470f578.jpg) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ── LEFT COLUMN (Grid of Services): 65-70% width ── */}
        <div className="lg:col-span-8 xl:col-span-8 space-y-4">
          {/* Header Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Chọn dịch vụ
            </h1>
          </div>

          {/* Category Filter Pills (Exact Match to Mockup) */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-1 scrollbar-hide">
            {categories.map((cat) => {
              const isActive = categoryFilter === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setCategoryFilter(cat.key)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#60a5fa] text-white shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-[#60a5fa]/60'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* ── Service Cards Grid: 4 columns on desktop ── */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center">
              <Spin size="large" />
              <p className="text-xs text-gray-400 mt-3 font-medium">Đang tải danh sách dịch vụ...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 text-red-600 rounded-2xl text-center font-medium text-sm">
              {error}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center shadow-xs">
              <Scissors className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 font-medium text-sm">Không có dịch vụ nào trong mục này</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 pt-1">
              {filteredServices.map((srv) => {
                const isSelected = isServiceSelected(srv);
                const isSuspended = !!srv.isSuspended;

                return (
                  <div
                    key={srv.id}
                    onClick={() => !isSuspended && toggleService(srv)}
                    className={`group bg-white rounded-2xl overflow-hidden border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                      isSuspended
                        ? 'opacity-60 cursor-not-allowed border-gray-200'
                        : isSelected
                        ? 'border-[#60a5fa] shadow-sm ring-1 ring-[#60a5fa]/30'
                        : 'border-gray-200/90 hover:border-[#60a5fa]/60 hover:shadow-sm'
                    }`}
                  >
                    <div>
                      {/* Image container with duration badge at bottom-left */}
                      <div className="h-32 sm:h-36 w-full relative overflow-hidden bg-gray-100">
                        <img
                          src={srv.image}
                          alt={srv.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#60a5fa]" />
                          {srv.duration} phút
                        </div>
                      </div>

                      {/* Content info */}
                      <div className="p-3">
                        <h3 className="font-bold text-xs sm:text-sm text-gray-900 line-clamp-2 min-h-[36px] leading-snug group-hover:text-blue-600 transition-colors">
                          {srv.name}
                        </h3>
                      </div>
                    </div>

                    {/* Bottom Row: Price on left, Checkbox on right */}
                    <div className="px-3 pb-3 pt-0 flex items-center justify-between">
                      <span className="font-extrabold text-xs sm:text-sm text-gray-900">
                        {formatPrice(srv.price)}
                      </span>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-[#60a5fa] text-white shadow-xs'
                            : 'border-2 border-gray-300 group-hover:border-[#60a5fa]'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Navigation back button */}
          <div className="pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Quay lại chọn Stylist & Thời gian
            </button>
          </div>
        </div>

        {/* ── RIGHT COLUMN (Sticky Booking Summary Card): 30-35% width ── */}
        <div className="lg:col-span-4 xl:col-span-4 sticky top-24">
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-5 overflow-hidden">
            {/* Header */}
            <div
              className="flex items-center justify-between cursor-pointer select-none mb-4"
              onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
            >
              <h2 className="text-base font-extrabold text-gray-900">
                Tóm tắt lịch hẹn
              </h2>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Toggle Summary"
              >
                {isSummaryExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>

            {isSummaryExpanded && (
              <div className="space-y-3.5 animate-fade-in">
                {/* 1. Salon Location */}
                <div className="flex items-start gap-2.5 text-xs text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <span className="font-semibold text-gray-900">
                    {selectedSalon?.salonName || selectedSalon?.name || 'BachBarber – Cầu Giấy'}
                  </span>
                </div>

                {/* 2. Stylist with Avatar & Rating */}
                <div className="flex items-center gap-2.5 text-xs text-gray-700">
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200 shrink-0">
                    <img
                      src={
                        selectedStylist?.avatarUrl ||
                        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop'
                      }
                      alt="Stylist"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-semibold text-gray-900">
                    {selectedStylist?.fullName || selectedStylist?.nickname || 'Anh Phong'}
                  </span>
                  <span className="text-amber-500 font-bold flex items-center gap-0.5 text-[11px]">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    4.9
                  </span>
                </div>

                {/* 3. Date & Time */}
                <div className="flex items-center gap-2.5 text-xs text-gray-700">
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="font-semibold text-gray-900">
                    {selectedTime || '14:30'} - {formatDisplayDate(selectedDate)}
                  </span>
                </div>

                {/* Dashed Separator */}
                <div className="border-b border-dashed border-gray-200 pt-1" />

                {/* 4. Selected Services List */}
                <div className="space-y-2 py-1">
                  {selectedServices.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-2">
                      Chưa chọn dịch vụ nào
                    </p>
                  ) : (
                    selectedServices.map((s) => (
                      <div key={s.id || s.name} className="flex items-center justify-between text-xs gap-2 group">
                        <span className="text-gray-700 line-clamp-1 flex-1">{s.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-gray-900">
                            {formatPrice(s.price)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeService(s);
                            }}
                            className="text-gray-300 hover:text-red-500 transition-colors p-0.5"
                            title="Xóa dịch vụ này"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* 5. Voucher Input */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Mã promo voucher
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Mode voucher"
                      value={voucherCodeInput}
                      onChange={(e) => setVoucherCodeInput(e.target.value)}
                      className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#60a5fa]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyVoucher}
                      disabled={applyingVoucher}
                      className="px-3.5 py-2 border border-[#60a5fa] text-[#60a5fa] hover:bg-blue-50 font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {applyingVoucher ? '...' : 'Áp dụng'}
                    </button>
                  </div>

                  {appliedVoucher && (
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      <span>✓ Đã áp dụng: {appliedVoucher.code}</span>
                      <span className="font-bold">-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                </div>

                {/* 6. Total Price */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-extrabold text-gray-900">
                    Tổng giá
                  </span>
                  <span className="text-base sm:text-lg font-black text-gray-900">
                    {formatPrice(finalAmount)}
                  </span>
                </div>

                {/* 7. CTA Action Button */}
                <button
                  type="button"
                  disabled={selectedServices.length === 0}
                  onClick={() => setStep(4)}
                  className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedServices.length > 0
                      ? 'bg-[#60a5fa] hover:bg-[#3b82f6] text-white shadow-blue-200 active:scale-98'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  Tiếp tục thanh toán
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}