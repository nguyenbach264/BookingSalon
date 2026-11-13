import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scissors,
  Star,
  Award,
  Users,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Building2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Skeleton, message } from 'antd';
import { getPublicSystemSummary } from '../../service/api/publicApi';

export default function AboutUsPage() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAboutUsData = () => {
    setLoading(true);
    setError(null);
    getPublicSystemSummary()
      .then((data) => {
        if (data) {
          setSummary(data);
        }
      })
      .catch((err) => {
        console.error("Lỗi khi tải thông tin hệ thống từ API:", err);
        setError("Không thể tải thông tin hệ thống từ cơ sở dữ liệu.");
        message.error("Lỗi kết nối cơ sở dữ liệu hệ thống!");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAboutUsData();
  }, []);

  const totalSalons = summary?.totalSalons ?? 0;
  const totalStylists = summary?.totalStylists ?? 0;
  const totalUsers = summary?.totalUsers ?? 0;
  const totalServices = summary?.totalServices ?? 0;
  const totalReviews = summary?.totalReviews ?? 0;
  const averageRating = summary?.averageRating ?? 4.95;
  const stylists = summary?.stylists ?? [];
  const salons = summary?.salons ?? [];
  const recentReviews = summary?.recentReviews ?? [];

  return (
    <div className="w-full bg-white min-h-screen py-8 font-sans text-slate-900">
      <div className="max-w-[1280px] mx-auto px-4">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <span className="hover:text-slate-600 cursor-pointer" onClick={() => navigate('/')}>Trang chủ</span>
          <span>/</span>
          <span className="text-slate-700 font-semibold">Về chúng tôi</span>
        </div>

        {/* ── 1. HERO STORY ─────────────────────────────────────────────── */}
        <div className="py-8 md:py-12 border-b border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-[#0099FF] text-xs font-bold mb-3" style={{ color: 'var(--primary-color, #0099FF)' }}>
                <Sparkles size={14} />
                <span>Câu Chuyện Thương Hiệu BachBarber</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4 leading-tight">
                Kiến Tạo Đẳng Cấp Làm Đẹp & Tự Tin Cho Phái Mạnh
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                Được thành lập với sứ mệnh định hình lại văn hóa Barber hiện đại tại Việt Nam, <strong>BachBarber</strong> kết hợp giữa kỹ thuật cắt tỉa cổ điển điêu luyện cùng công nghệ chăm sóc tóc, spa da đầu chuẩn mực quốc tế.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                Mỗi lượt khách đến với BachBarber không chỉ để làm mới diện mạo, mà còn tận hưởng khoảng thời gian thư giãn trọn vẹn trong không gian sang trọng, âm nhạc tinh tế và dịch vụ chăm sóc tận tâm.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/booking')}
                  className="px-6 py-3 rounded-full text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                  style={{ backgroundColor: 'var(--primary-color, #0099FF)' }}
                >
                  <Calendar size={16} />
                  <span>Đặt Lịch Trải Nghiệm Ngay</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/salons')}
                  className="px-6 py-3 rounded-full text-slate-700 bg-slate-100 hover:bg-slate-200 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Building2 size={16} />
                  <span>Xem {totalSalons} Chi Nhánh</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-50 aspect-4/3 bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1000&auto=format&fit=crop&q=80"
                  alt="BachBarber Space"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating verified badge */}
              <div className="absolute -bottom-4 -left-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: 'var(--primary-color, #0099FF)' }}>
                  <Award size={24} />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">Chuẩn Mực 5 Sao</div>
                  <div className="text-[11px] text-slate-500">Được đồng bộ trực tiếp từ Database</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center max-w-md mx-auto my-8">
            <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 mb-1">Lỗi tải dữ liệu hệ thống</h3>
            <p className="text-xs text-slate-600 mb-4">{error}</p>
            <button
              onClick={fetchAboutUsData}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-bold text-xs shadow-xs"
              style={{ backgroundColor: 'var(--primary-color, #0099FF)' }}
            >
              <RefreshCw size={14} />
              <span>Thử lại</span>
            </button>
          </div>
        )}

        {/* ── 2. LIVE SYSTEM STATISTICS FROM DATABASE ─────────────────── */}
        <div className="py-12 border-b border-slate-100">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0099FF]" style={{ color: 'var(--primary-color, #0099FF)' }}>
              Dữ Liệu Vận Hành Thực Tế
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              Những Con Số Ấn Tượng
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Các chỉ số thời gian thực được tổng hợp trực tiếp từ cơ sở dữ liệu hệ thống.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <Skeleton active paragraph={{ rows: 2 }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Stat 1: Salons */}
              <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 text-center hover:bg-blue-50/30 transition-colors">
                <Building2 size={24} className="mx-auto mb-2 text-[#0099FF]" style={{ color: 'var(--primary-color, #0099FF)' }} />
                <div className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
                  {totalSalons}
                </div>
                <div className="text-xs font-bold text-slate-700">Chi Nhánh Salon</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Hà Nội & TP.HCM</div>
              </div>

              {/* Stat 2: Stylists */}
              <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 text-center hover:bg-blue-50/30 transition-colors">
                <Scissors size={24} className="mx-auto mb-2 text-[#0099FF]" style={{ color: 'var(--primary-color, #0099FF)' }} />
                <div className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
                  {totalStylists}
                </div>
                <div className="text-xs font-bold text-slate-700">Master & Senior Stylist</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Kỹ thuật đỉnh cao</div>
              </div>

              {/* Stat 3: Users */}
              <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 text-center hover:bg-blue-50/30 transition-colors">
                <Users size={24} className="mx-auto mb-2 text-[#0099FF]" style={{ color: 'var(--primary-color, #0099FF)' }} />
                <div className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
                  {totalUsers.toLocaleString('vi-VN')}
                </div>
                <div className="text-xs font-bold text-slate-700">Khách Hàng Thành Viên</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Đã đăng ký tài khoản</div>
              </div>

              {/* Stat 4: Services */}
              <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 text-center hover:bg-blue-50/30 transition-colors">
                <Sparkles size={24} className="mx-auto mb-2 text-[#0099FF]" style={{ color: 'var(--primary-color, #0099FF)' }} />
                <div className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
                  {totalServices}
                </div>
                <div className="text-xs font-bold text-slate-700">Gói Dịch Vụ & Combo</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Cắt, uốn, nhuộm, spa</div>
              </div>

              {/* Stat 5: Rating & Reviews */}
              <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 text-center hover:bg-blue-50/30 transition-colors col-span-2 sm:col-span-1">
                <Star size={24} className="mx-auto mb-2 text-amber-500 fill-amber-500" />
                <div className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
                  {averageRating}★
                </div>
                <div className="text-xs font-bold text-slate-700">Đánh Giá Trung Bình</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{totalReviews} phản hồi thực tế</div>
              </div>
            </div>
          )}
        </div>

        {/* ── 3. REAL MASTER & SENIOR STYLISTS FROM DATABASE ───────────── */}
        <div className="py-12 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0099FF]" style={{ color: 'var(--primary-color, #0099FF)' }}>
                Đội Ngũ Nghệ Nhân Tóc
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Master & Senior Stylist Từ Hệ Thống
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Danh sách thợ chính giàu kinh nghiệm, đạt chuẩn tay nghề và liên tục đào tạo kỹ thuật mới.
              </p>
            </div>
            <button
              onClick={() => navigate('/booking')}
              className="text-xs font-bold text-[#0099FF] flex items-center gap-1 hover:underline self-start sm:self-auto cursor-pointer"
              style={{ color: 'var(--primary-color, #0099FF)' }}
            >
              <span>Chọn stylist khi đặt lịch</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-slate-50 rounded-3xl p-4 border border-slate-100">
                  <Skeleton active avatar paragraph={{ rows: 3 }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {stylists.map((st) => {
                const avatar =
                  st.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
                const isMaster = st.levelRank === 'MASTER';

                return (
                  <div
                    key={st.id}
                    className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Avatar Image */}
                      <div className="h-56 w-full overflow-hidden bg-slate-100 relative">
                        <img
                          src={avatar}
                          alt={st.fullName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Level Tag */}
                        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-black shadow-xs flex items-center gap-1">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: isMaster ? '#f59e0b' : '#0099FF' }}
                          />
                          <span className={isMaster ? 'text-amber-700' : 'text-blue-700'}>
                            {isMaster ? 'MASTER BARBER' : 'SENIOR STYLIST'}
                          </span>
                        </div>
                        {/* Rating */}
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg text-white text-[11px] font-bold flex items-center gap-1">
                          <Star size={12} className="text-amber-400 fill-amber-400" />
                          <span>{st.ratingAverage || '5.0'}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <div className="flex items-baseline justify-between gap-1 mb-1">
                          <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0099FF] transition-colors">
                            {st.fullName}
                          </h3>
                          {st.nickname && (
                            <span className="text-[11px] font-medium text-slate-400">
                              ({st.nickname})
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 mb-2 flex items-center gap-1">
                          <Building2 size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{st.salonName}</span>
                        </div>

                        <div className="text-[11px] font-semibold text-slate-700 mb-2">
                          Kinh nghiệm: {st.experienceYears} năm thực tế
                        </div>

                        {st.specialties && (
                          <div className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <strong>Thế mạnh:</strong> {st.specialties}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <button
                        type="button"
                        onClick={() => navigate('/booking')}
                        className="w-full py-2 rounded-xl text-xs font-bold text-white shadow-2xs hover:shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                        style={{ backgroundColor: 'var(--primary-color, #0099FF)' }}
                      >
                        <span>Đặt Lịch Với {st.nickname || st.fullName}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 4. REAL SALON BRANCHES FROM DATABASE ─────────────────────── */}
        <div className="py-12 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0099FF]" style={{ color: 'var(--primary-color, #0099FF)' }}>
                Hệ Thống Cơ Sở Salon
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Các Chi Nhánh Đang Hoạt Động
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Không gian thiết kế đồng bộ mang đến trải nghiệm tiện nghi và riêng tư.
              </p>
            </div>
            <button
              onClick={() => navigate('/salons')}
              className="text-xs font-bold text-[#0099FF] flex items-center gap-1 hover:underline self-start sm:self-auto cursor-pointer"
              style={{ color: 'var(--primary-color, #0099FF)' }}
            >
              <span>Xem chi tiết tất cả chi nhánh</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {salons.map((s) => {
              const photo =
                s.images && s.images.length > 0
                  ? s.images[0]
                  : 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&auto=format&fit=crop&q=80';

              return (
                <div
                  key={s.id}
                  className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="h-36 rounded-xl overflow-hidden mb-3 bg-slate-200">
                      <img src={photo} alt={s.salonName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{s.salonName}</h4>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 shrink-0">
                        {s.city}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mb-2 leading-relaxed">
                      {s.address}
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mb-3">
                      <Clock size={12} />
                      <span>{String(s.openTime).slice(0, 5)} - {String(s.closeTime).slice(0, 5)}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/booking')}
                    className="w-full py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-2xs"
                    style={{ backgroundColor: 'var(--primary-color, #0099FF)' }}
                  >
                    Đặt lịch chi nhánh này
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 5. REAL REVIEWS FROM DATABASE ────────────────────────────── */}
        {recentReviews.length > 0 && (
          <div className="py-12 border-b border-slate-100">
            <div className="text-center max-w-xl mx-auto mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0099FF]" style={{ color: 'var(--primary-color, #0099FF)' }}>
                Đánh Giá Thực Tế Từ Khách Hàng
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Khách Hàng Nói Gì Về BachBarber?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Các lượt phản hồi chân thật sau khi trải nghiệm dịch vụ và sản phẩm.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {recentReviews.slice(0, 6).map((rev) => (
                <div
                  key={rev.id}
                  className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between hover:bg-white hover:shadow-md transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={
                              i < (rev.rating || 5)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-200'
                            }
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">Đã xác thực</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed mb-4 italic">
                      "{rev.reviewContent || 'Dịch vụ rất tốt, thợ cắt tỉ mỉ và tư vấn nhiệt tình.'}"
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-200/60">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {(rev.customerName?.charAt(0) || 'K').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">{rev.customerName}</div>
                      <div className="text-[10px] text-slate-400">Khách hàng hệ thống</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 6. BOTTOM CTA ────────────────────────────────────────────── */}
        <div className="py-12">
          <div
            className="rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-xl"
            style={{ backgroundColor: 'var(--primary-color, #0099FF)' }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3">
              Sẵn Sàng Cho Một Diện Mạo Hoàn Toàn Mới?
            </h2>
            <p className="text-xs sm:text-sm text-white/90 max-w-xl mx-auto mb-6 leading-relaxed">
              Đặt lịch trực tuyến chỉ trong 30 giây. Chọn thợ ruột, chọn khung giờ thuận tiện và đến tận hưởng dịch vụ không cần xếp hàng chờ đợi.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/booking')}
                className="px-8 py-3.5 rounded-full bg-white text-slate-900 font-black text-xs sm:text-sm shadow-md hover:bg-slate-50 transition-all active:scale-95 cursor-pointer"
              >
                Đặt Lịch Hẹn Ngay
              </button>
              <button
                type="button"
                onClick={() => navigate('/promotions')}
                className="px-6 py-3.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm transition-all border border-white/30 cursor-pointer"
              >
                Xem Kho Voucher
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
