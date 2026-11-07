import React, { useState, useEffect, useRef } from 'react';
import { Carousel, Skeleton, message } from 'antd';
import {
  MapPin,
  Clock,
  Star,
  Scissors,
  Calendar,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSalons } from '../../service/api/salonApi';
import { getServiceOfferings } from '../../service/api/serviceApi';
import { useAuth } from '../../auth/authProvider';
import { useBooking } from '../../service/context/BookingContext';
import { DB_BASELINE_SERVICES, normalizeService } from '../../service/baselineServices';

const CAROUSEL_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80',
    badge: 'BachBarber Premium',
    title: 'Phong cách mới\n— BachBarber',
    sub: 'Trải nghiệm cắt tóc đẳng cấp, định hình phong cách riêng cùng đội ngũ chuyên gia tận tâm.',
    cta: 'Đặt lịch ngay',
  },
  {
    image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop&q=80',
    badge: 'Đẳng cấp quốc tế',
    title: 'Dịch vụ chuẩn\nSalon quốc tế',
    sub: 'Không gian sang trọng, dịch vụ tận tâm, chăm sóc từng sợi tóc theo tiêu chuẩn châu Âu.',
    cta: 'Đặt lịch ngay',
  },
  {
    image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&auto=format&fit=crop&q=80',
    badge: 'Top Master Stylist',
    title: 'Master Stylist\ntay nghề cao',
    sub: 'Hơn 5 năm kinh nghiệm phục vụ hàng ngàn khách hàng hài lòng tại mỗi chi nhánh.',
    cta: 'Đặt lịch ngay',
  },
];

const FEATURE_PILLS = [
  { icon: '✂️', text: 'Master Stylist 5+ năm' },
  { icon: '🌿', text: 'Sản phẩm cao cấp' },
  { icon: '📅', text: 'Đặt lịch online 24/7' },
  { icon: '⭐', text: 'Đánh giá 4.9★ (3k+ lượt)' },
];

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN').format(price) + 'đ';

export default function HomeContent() {
  const navigate = useNavigate();
  const { authenticated, openLoginModal } = useAuth();
  const { setSelectedServices, setSelectedSalon } = useBooking();

  const [salons, setSalons] = useState([]);
  const [services, setServices] = useState([]);
  const [salonsLoading, setSalonsLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);

  const carouselRef = useRef(null);

  const handleBookingClick = () => {
    if (!authenticated) {
      openLoginModal('Quý khách cần đăng nhập tài khoản để thực hiện đặt lịch dịch vụ!', '/booking');
    } else {
      navigate('/booking');
    }
  };

  const handleBookService = (srv) => {
    if (srv) {
      const normalized = normalizeService(srv);
      setSelectedServices([normalized]);
    }
    if (!authenticated) {
      openLoginModal('Quý khách cần đăng nhập tài khoản để thực hiện đặt lịch dịch vụ!', '/booking');
    } else {
      navigate('/booking');
    }
  };

  const handleBookSalon = (salon) => {
    if (salon) {
      setSelectedSalon(salon);
    }
    if (!authenticated) {
      openLoginModal('Quý khách cần đăng nhập tài khoản để thực hiện đặt lịch dịch vụ!', '/booking');
    } else {
      navigate('/booking');
    }
  };

  useEffect(() => {
    getSalons()
      .then(setSalons)
      .catch(() => setSalons([]))
      .finally(() => setSalonsLoading(false));
  }, []);

  useEffect(() => {
    getServiceOfferings()
      .then((data) => {
        const list = Array.isArray(data) && data.length > 0 ? data.slice(0, 3) : DB_BASELINE_SERVICES.slice(0, 3);
        setServices(list.map((s, idx) => normalizeService(s, idx)));
      })
      .catch(() => {
        setServices(DB_BASELINE_SERVICES.slice(0, 3).map((s, idx) => normalizeService(s, idx)));
      })
      .finally(() => setServicesLoading(false));
  }, []);

  const formatTime = (t) => {
    if (!t) return '08:00 - 21:00';
    if (typeof t === 'string') return t;
    if (Array.isArray(t)) return `${String(t[0]).padStart(2, '0')}:${String(t[1]).padStart(2, '0')}`;
    return String(t);
  };

  // Baseline 3 featured services from DB
  const displayServices = services.length > 0
    ? services
    : DB_BASELINE_SERVICES.slice(0, 3).map((s, idx) => normalizeService(s, idx));

  // Fallback salons if API is empty
  const displaySalons = salons.length > 0 ? salons : [
    {
      id: 'salon-1',
      salonName: 'BachBarber – Cầu Giấy',
      address: '18 Cầu Giấy, Hà Nội',
      openTime: '08:00',
      closeTime: '21:00',
      image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&auto=format&fit=crop',
    },
    {
      id: 'salon-2',
      salonName: 'BachBarber – Hai Bà Trưng',
      address: '18 Cầu Giấy, Hà Nội',
      openTime: '08:00',
      closeTime: '21:00',
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop',
    },
  ];

  return (
    <div className="w-full bg-[#f0f6ff] min-h-screen flex flex-col pb-16 font-sans">
      <div className="max-w-[1200px] mx-auto px-4 w-full pt-6">

        {/* ── 1. HERO SLIDER (Mockup: White floating card, Image left, Text right) ── */}
        <div className="bg-white rounded-[28px] shadow-sm border border-gray-100 overflow-hidden mb-6 relative group">
          <Carousel
            ref={carouselRef}
            autoplay
            autoplaySpeed={5000}
            speed={500}
            dots={true}
            arrows={false}
            className="home-hero-carousel"
          >
            {CAROUSEL_SLIDES.map((slide, idx) => (
              <div key={idx} className="outline-none">
                <div className="grid grid-cols-1 md:grid-cols-12 items-center min-h-[360px] md:min-h-[420px]">
                  {/* Left: Image */}
                  <div className="md:col-span-6 h-[260px] md:h-[420px] w-full overflow-hidden bg-gray-100 relative">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Right: Content */}
                  <div className="md:col-span-6 p-6 sm:p-10 md:p-12 flex flex-col justify-center items-start">
                    <div className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                      <Scissors size={12} className="text-[#60a5fa]" />
                      {slide.badge}
                    </div>

                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-3 whitespace-pre-line tracking-tight">
                      {slide.title}
                    </h1>

                    <p className="text-gray-500 text-xs sm:text-sm mb-6 max-w-md leading-relaxed">
                      {slide.sub}
                    </p>

                    <button
                      onClick={handleBookingClick}
                      className="inline-flex items-center gap-2 bg-[#60a5fa] hover:bg-[#3b82f6] text-white font-bold py-2.5 px-6 rounded-full transition-all text-xs sm:text-sm cursor-pointer shadow-sm shadow-blue-200 active:scale-95"
                    >
                      {slide.cta}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </Carousel>
        </div>

        {/* ── 2. FEATURE STRIP (Mockup: 4 separate floating white pill chips) ── */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-10">
          {FEATURE_PILLS.map((pill, i) => (
            <div
              key={i}
              className="bg-white rounded-full py-2 px-4 sm:px-5 shadow-xs border border-gray-100 flex items-center gap-2 text-xs font-semibold text-gray-700 select-none hover:shadow-sm transition-shadow"
            >
              <span>{pill.icon}</span>
              <span>{pill.text}</span>
            </div>
          ))}
        </div>

        {/* ── 3. DỊCH VỤ NỔI BẬT (Mockup: 3 cards in row) ── */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">
              Dịch vụ nổi bật
            </h2>
            <button
              onClick={() => navigate('/service')}
              className="text-xs font-bold text-[#60a5fa] hover:underline"
            >
              Xem tất cả
            </button>
          </div>

          {servicesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-2xl p-4 h-64 border border-gray-100">
                  <Skeleton active paragraph={{ rows: 3 }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayServices.map((srv) => (
                <div
                  key={srv.id}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-xs hover:shadow-md transition-all duration-200 group flex flex-col justify-between"
                >
                  <div>
                    {/* Image with usage tag */}
                    <div className="h-44 w-full relative overflow-hidden bg-gray-100">
                      <img
                        src={
                          srv.image ||
                          srv.img ||
                          'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&auto=format&fit=crop'
                        }
                        alt={srv.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2.5 right-2.5 bg-white/95 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                        🔥 1.2k lượt
                      </span>
                    </div>

                    {/* Card Content */}
                    <div className="p-4">
                      {/* Name & Star */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-1">
                          {srv.name}
                        </h3>
                        <div className="flex items-center gap-0.5 text-xs font-bold text-gray-800 shrink-0">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          <span>4.9★</span>
                        </div>
                      </div>

                      {/* Duration & Button */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock size={11} className="text-gray-400" />
                          {srv.duration || 45} phút
                        </span>
                        <button
                          onClick={() => handleBookService(srv)}
                          className="bg-[#60a5fa] hover:bg-[#3b82f6] text-white font-semibold text-xs px-3.5 py-1 rounded-full transition-colors cursor-pointer"
                        >
                          Đặt ngay
                        </button>
                      </div>

                      {/* Price */}
                      <div className="font-extrabold text-sm text-gray-900">
                        {formatPrice(srv.price || 180000)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 4. HỆ THỐNG SALON (Mockup: Horizontal split cards) ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">
              Hệ thống Salon
            </h2>
          </div>

          {salonsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2].map((n) => (
                <div key={n} className="bg-white rounded-2xl p-4 h-40 border border-gray-100">
                  <Skeleton active paragraph={{ rows: 2 }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {displaySalons.map((salon, idx) => {
                const salonImg =
                  salon.image ||
                  salon.img ||
                  (idx === 0
                    ? 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&auto=format&fit=crop'
                    : 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop');

                return (
                  <div
                    key={salon.id || idx}
                    className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row"
                  >
                    {/* Left: Thumbnail */}
                    <div className="w-full sm:w-44 h-36 sm:h-auto overflow-hidden bg-gray-100 shrink-0">
                      <img
                        src={salonImg}
                        alt={salon.salonName || salon.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Right: Info */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-extrabold text-gray-900 text-sm sm:text-base mb-1.5 leading-snug">
                          {salon.salonName || salon.name}
                        </h3>
                        <p className="text-xs text-gray-500 flex items-start gap-1.5 mb-1 line-clamp-1">
                          <MapPin size={13} className="text-rose-500 shrink-0 mt-0.5" />
                          <span>{salon.address || '18 Cầu Giấy, Hà Nội'}</span>
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-3">
                          <Clock size={13} className="text-gray-400 shrink-0" />
                          <span>
                            {formatTime(salon.openTime)} - {formatTime(salon.closeTime)}
                          </span>
                        </p>
                      </div>

                      <button
                        onClick={() => handleBookSalon(salon)}
                        className="w-full sm:w-auto px-4 py-2 bg-[#60a5fa] hover:bg-[#3b82f6] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
                      >
                        Đặt lịch tại đây
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}