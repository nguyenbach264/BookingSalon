import { Carousel, Rate, Skeleton, message, Tag } from 'antd';
import {
  ChevronRight,
  ChevronLeft,
  MapPin,
  Clock,
  Star,
  Scissors,
  ShoppingBag,
  Phone,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useReviewWebSocket from '../../hooks/useReviewWebSocket';
import { getReviews, createReview } from '../../service/api/reviewApi';
import { getSalons } from '../../service/api/salonApi';
import { getServiceOfferings } from '../../service/api/serviceApi';
import { useAuth } from '../../auth/authProvider';

const CAROUSEL_SLIDES = [
  {
    src: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1400&h=500&auto=format&fit=crop&q=90',
    title: 'Phong cách mới — BachBarber',
    sub: 'Trải nghiệm cắt tóc đẳng cấp với đội ngũ Master Stylist',
    cta: 'Đặt lịch ngay',
  },
  {
    src: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1400&h=500&auto=format&fit=crop&q=90',
    title: 'Dịch vụ chuẩn Salon quốc tế',
    sub: 'Không gian sang trọng, dịch vụ tận tâm, chăm sóc từng sợi tóc',
    cta: 'Xem bảng giá',
  },
  {
    src: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=1400&h=500&auto=format&fit=crop&q=90',
    title: 'Master Stylist tay nghề cao',
    sub: 'Hơn 5 năm kinh nghiệm phục vụ hàng ngàn khách hàng hài lòng',
    cta: 'Đặt lịch ngay',
  },
  {
    src: 'https://images.unsplash.com/photo-1517832606589-7629c3395909?w=1400&h=500&auto=format&fit=crop&q=90',
    title: 'Sản phẩm chăm sóc chính hãng',
    sub: 'Mỹ phẩm tóc cao cấp nhập khẩu từ Đức, Mỹ, Nhật Bản',
    cta: 'Khám phá ngay',
  },
];

const FEATURE_CARDS = [
  { icon: '✂️', title: 'Master Stylist', desc: '5+ năm kinh nghiệm tại mỗi salon' },
  { icon: '🌿', title: 'Sản phẩm cao cấp', desc: 'Wella, L\'Oreal, Kevin Murphy' },
  { icon: '📅', title: 'Đặt lịch online', desc: 'Đặt lịch 24/7, nhận xác nhận ngay' },
  { icon: '⭐', title: 'Đánh giá 4.9★', desc: 'Hơn 10,000+ khách hàng hài lòng' },
];

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN').format(price) + '₫';

const HomeContent = () => {
  const navigate = useNavigate();
  const { authenticated, openLoginModal } = useAuth();

  const handleBookingClick = () => {
    if (!authenticated) {
      openLoginModal('Quý khách cần đăng nhập tài khoản để thực hiện đặt lịch dịch vụ!', '/booking');
    } else {
      navigate('/booking');
    }
  };

  const [salons, setSalons] = useState([]);
  const [services, setServices] = useState([]);
  const [salonsLoading, setSalonsLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);

  const [reviewContent, setReviewContent] = useState('');
  const [reviews, setReviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load salons
  useEffect(() => {
    getSalons()
      .then(setSalons)
      .catch(() => setSalons([]))
      .finally(() => setSalonsLoading(false));
  }, []);

  // Load services
  useEffect(() => {
    getServiceOfferings()
      .then((data) => setServices(data.slice(0, 6)))
      .catch(() => setServices([]))
      .finally(() => setServicesLoading(false));
  }, []);

  // Load reviews
  useEffect(() => {
    getReviews()
      .then(setReviews)
      .catch(() => setReviews([]));
  }, []);

  const handleNewReview = useCallback((newReview) => {
    setReviews((prev) => {
      if (prev.some((r) => r.id === newReview.id)) return prev;
      return [...prev, newReview];
    });
  }, []);

  useReviewWebSocket({ onNewReview: handleNewReview });

  const handleSubmit = async () => {
    const content = reviewContent.trim();
    if (!content) return;
    try {
      setIsSubmitting(true);
      const created = await createReview({
        userId: '10000000-0000-0000-0000-000000000008',
        type: 'NEW_REVIEW',
        reviewContent: content,
      });
      setReviewContent('');
      setReviews((prev) => [...prev, created]);
      message.success('Đánh giá đã được gửi!');
    } catch {
      message.error('Không thể gửi đánh giá.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const carouselRef = useRef(null);
  const isAnimatingRef = useRef(false);

  const handlePrev = (e) => {
    e?.stopPropagation();
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    carouselRef.current?.prev();
    setTimeout(() => {
      isAnimatingRef.current = false;
    }, 450);
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    carouselRef.current?.next();
    setTimeout(() => {
      isAnimatingRef.current = false;
    }, 450);
  };

  return (
    <div className="w-full bg-gray-50 flex flex-col pb-20">

      {/* ── HERO CAROUSEL ──────────────────────────────────────────── */}
      <div className="w-full relative select-none group">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous slide"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white cursor-pointer backdrop-blur-sm transition-all shadow-lg hover:scale-105 active:scale-95"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next slide"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white cursor-pointer backdrop-blur-sm transition-all shadow-lg hover:scale-105 active:scale-95"
        >
          <ChevronRight size={22} />
        </button>
        <Carousel
          ref={carouselRef}
          autoplay
          autoplaySpeed={5000}
          speed={500}
          draggable
          swipeToSlide
          dots
          arrows={false}
          className="custom-dots"
        >
          {CAROUSEL_SLIDES.map((slide, i) => (
            <div key={i} className="outline-none">
              <div className="h-[340px] md:h-[520px] relative overflow-hidden">
                <img
                  src={slide.src}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-center pl-8 md:pl-20">
                  <span className="inline-flex items-center gap-2 text-amber-400 font-semibold text-sm mb-3 tracking-wider">
                    <Scissors size={16} />
                    BACHBARBER PREMIUM
                  </span>
                  <h1 className="text-white text-3xl md:text-5xl font-black leading-tight mb-3 max-w-xl">
                    {slide.title}
                  </h1>
                  <p className="text-white/80 text-base md:text-lg mb-6 max-w-md">
                    {slide.sub}
                  </p>
                  <button
                    onClick={() => {
                      if (slide.cta?.toLowerCase().includes('lịch')) {
                        handleBookingClick();
                      } else {
                        navigate('/service');
                      }
                    }}
                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 px-7 rounded-full transition-all duration-300 w-fit text-sm cursor-pointer shadow-md"
                  >
                    {slide.cta}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </Carousel>
      </div>

      {/* ── FEATURE STRIP ──────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 py-6">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {FEATURE_CARDS.map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <span className="text-3xl">{f.icon}</span>
              <div>
                <p className="font-bold text-gray-800 text-sm">{f.title}</p>
                <p className="text-gray-500 text-xs">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SERVICES SECTION ───────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-amber-500 font-semibold text-sm mb-1 tracking-wider">
              <Sparkles size={14} />
              DỊCH VỤ NỔI BẬT
            </div>
            <h2 className="text-3xl font-black text-gray-900">
              Trải nghiệm BachBarber
            </h2>
          </div>
          <button
            onClick={() => navigate('/service')}
            className="hidden md:flex items-center gap-1 text-amber-600 font-semibold hover:underline text-sm"
          >
            Xem tất cả <ArrowRight size={15} />
          </button>
        </div>

        {servicesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} active className="rounded-2xl overflow-hidden" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Fallback to curated static cards if API empty */}
            {[
              { name: 'Cắt Fade + Undercut', price: 180000, duration: 60, img: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&auto=format&fit=crop', rating: 4.95 },
              { name: 'Gội đầu massage VIP', price: 150000, duration: 60, img: 'https://images.unsplash.com/photo-1516975080661-46bfa33f93a1?w=500&auto=format&fit=crop', rating: 4.88 },
              { name: 'Nhuộm tóc thời trang', price: 480000, duration: 150, img: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=500&auto=format&fit=crop', rating: 4.80 },
              { name: 'Uốn tóc Hàn Quốc', price: 350000, duration: 120, img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop', rating: 4.85 },
              { name: 'Cạo râu Straight Razor', price: 130000, duration: 40, img: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&auto=format&fit=crop', rating: 4.92 },
              { name: 'Chăm sóc da mặt', price: 200000, duration: 75, img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&auto=format&fit=crop', rating: 4.75 },
            ].map((s, i) => (
              <ServiceCard key={i} service={s} onClick={() => navigate('/service')} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <ServiceCard key={s.id} service={s} onClick={() => navigate('/service')} />
            ))}
          </div>
        )}
      </div>

      {/* ── SALONS SECTION ─────────────────────────────────────────── */}
      <div className="bg-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-amber-500 font-semibold text-sm mb-1 tracking-wider">
                <MapPin size={14} />
                HỆ THỐNG SALON
              </div>
              <h2 className="text-3xl font-black text-gray-900">
                Chi nhánh BachBarber
              </h2>
            </div>
          </div>

          {salonsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} active className="rounded-2xl" />
              ))}
            </div>
          ) : salons.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { salonName: 'BachBarber – Cầu Giấy', address: '52 Trần Thái Tông, Cầu Giấy, Hà Nội', openTime: '08:00', closeTime: '21:00', img: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&auto=format&fit=crop' },
                { salonName: 'BachBarber – Hoàn Kiếm', address: '18 Lý Thái Tổ, Hoàn Kiếm, Hà Nội', openTime: '08:30', closeTime: '21:30', img: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop' },
                { salonName: 'BachBarber – Sài Gòn Q1', address: '75 Nguyễn Huệ, Quận 1, TP.HCM', openTime: '07:30', closeTime: '22:00', img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&auto=format&fit=crop' },
              ].map((s, i) => (
                <SalonCard key={i} salon={s} onClick={handleBookingClick} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {salons.map((s) => (
                <SalonCard key={s.id} salon={s} onClick={handleBookingClick} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ──────────────────────────────────────────────────────────

const ServiceCard = ({ service, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
  >
    <div className="h-44 overflow-hidden relative">
      <img
        src={service.image || service.img || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=500&auto=format&fit=crop'}
        alt={service.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      {service.usageCount > 0 && (
        <span className="absolute top-3 right-3 bg-amber-400 text-black text-xs font-bold px-2 py-0.5 rounded-full">
          🔥 {(service.usageCount / 1000).toFixed(1)}k lượt
        </span>
      )}
    </div>
    <div className="p-5">
      <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-amber-600 transition-colors">
        {service.name}
      </h3>
      <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
        {service.duration && (
          <span className="flex items-center gap-1">
            <Clock size={13} /> {service.duration} phút
          </span>
        )}
        {(service.rating || 4.8) && (
          <span className="flex items-center gap-1">
            <Star size={13} className="text-amber-400 fill-amber-400" />
            {service.rating ?? 4.8}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-amber-600 font-black text-lg">
          {service.price ? formatPrice(service.price) : formatPrice(service.price)}
        </span>
        <span className="text-amber-600 text-sm font-semibold flex items-center gap-1 hover:underline">
          Đặt ngay <ChevronRight size={14} />
        </span>
      </div>
    </div>
  </div>
);

const SalonCard = ({ salon, onClick }) => {
  const SALON_IMAGES = [
    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&auto=format&fit=crop',
  ];
  const img = salon.img || SALON_IMAGES[Math.floor(Math.random() * SALON_IMAGES.length)];

  const formatTime = (t) => {
    if (!t) return '–';
    if (typeof t === 'string') return t;
    // LocalTime array [h, m]
    if (Array.isArray(t)) return `${String(t[0]).padStart(2, '0')}:${String(t[1]).padStart(2, '0')}`;
    return t;
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
    >
      <div className="h-44 overflow-hidden relative">
        <img
          src={img}
          alt={salon.salonName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <span className="absolute bottom-3 left-3 text-white font-black text-base drop-shadow">
          {salon.salonName}
        </span>
      </div>
      <div className="p-5">
        <div className="flex items-start gap-2 text-gray-600 text-sm mb-2">
          <MapPin size={14} className="mt-0.5 text-amber-500 flex-shrink-0" />
          <span>{salon.address}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 text-sm mb-4">
          <Clock size={14} className="text-amber-500" />
          <span>{formatTime(salon.openTime)} – {formatTime(salon.closeTime)}</span>
        </div>
        <button className="w-full bg-gray-900 hover:bg-amber-500 text-white hover:text-black font-semibold py-2 rounded-xl transition-all duration-300 text-sm">
          Đặt lịch tại đây
        </button>
      </div>
    </div>
  );
};

export default HomeContent;