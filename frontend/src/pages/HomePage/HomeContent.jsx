import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Skeleton } from 'antd';
import {
  MapPin,
  Clock,
  Star,
  Scissors,
  Calendar,
  ArrowRight,
  Search,
  CheckCircle2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Award,
  Zap,
  Sparkles,
  Gift,
  Copy,
  Check,
  ShoppingBag,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSalons } from '../../service/api/salonApi';
import { getServiceOfferings } from '../../service/api/serviceApi';
import { useAuth } from '../../auth/authProvider';
import { useBooking } from '../../service/context/BookingContext';
import { DB_BASELINE_SERVICES, normalizeService } from '../../service/baselineServices';

// 4 nhóm dịch vụ cốt lõi theo phong cách Salon cao cấp
const SERVICE_GROUPS = [
  {
    id: 'cut',
    title: 'Cắt Tóc Nam & Fade',
    shortTitle: 'Cắt tóc nam & Fade',
    icon: '✂️',
    description: 'Tạo kiểu hiện đại, chuẩn tỉ lệ khuôn mặt cùng kỹ thuật Fade sắc nét',
    keywords: ['cắt', 'fade', 'undercut', 'tóc nam', 'tỉa'],
    defaultServices: [
      {
        id: 'cut-1',
        name: 'Cắt Fade + Undercut',
        price: 180000,
        duration: 60,
        description: 'Kỹ thuật fade (low/mid/high) kết hợp undercut tạo độ sắc nét tối đa, phù hợp phong cách street và Hàn Quốc.',
        image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80',
        categoryName: 'Cắt tóc nam & Fade',
        rating: 4.95,
      },
      {
        id: 'cut-2',
        name: 'Cắt tóc nam chuẩn BachBarber',
        price: 120000,
        duration: 45,
        description: 'Cắt tóc theo phong cách hiện đại, tư vấn kiểu phù hợp khuôn mặt, gội đầu massage thư giãn sau cắt.',
        image: 'https://images.unsplash.com/photo-1598524374912-628cbcddbc1f?w=600&auto=format&fit=crop&q=80',
        categoryName: 'Cắt tóc nam & Fade',
        rating: 4.9,
      },
      {
        id: 'cut-3',
        name: 'Tỉa tóc & Tạo kiểu Textured Crop',
        price: 140000,
        duration: 45,
        description: 'Tỉa so le tạo tầng layer tự nhiên, sấy phồng chân tóc và vuốt sáp giữ nếp textured trẻ trung cá tính.',
        image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&auto=format&fit=crop&q=80',
        categoryName: 'Cắt tóc nam & Fade',
        rating: 4.88,
      },
    ],
  },
  {
    id: 'spa',
    title: 'Gội Thảo Dược & Massage',
    shortTitle: 'Gội thảo dược & Massage',
    icon: '🌿',
    description: 'Thư giãn tuyệt đối với nước ấm thảo mộc, ấn huyệt cổ vai gáy và đắp khăn nóng',
    keywords: ['gội', 'massage', 'dưỡng sinh', 'combo', 'spa', 'thảo dược'],
    defaultServices: [
      {
        id: 'spa-1',
        name: 'Combo Cắt + Gội + Massage VIP',
        price: 150000,
        duration: 60,
        description: 'Gói phục vụ trọn gói cao cấp nhất: Cắt tóc, gội dưỡng sinh 30 phút, đắp mặt nạ và sấy tạo kiểu bằng sáp xịn.',
        image: 'https://images.unsplash.com/photo-1516975080661-46bfa33f93a1?w=600&auto=format&fit=crop&q=80',
        categoryName: 'Gội thảo dược & Massage',
        rating: 4.96,
      },
      {
        id: 'spa-2',
        name: 'Gội đầu dưỡng sinh thảo dược & Bấm huyệt',
        price: 120000,
        duration: 45,
        description: 'Gội nước bồ kết ấm, sả chanh tự nhiên kết hợp massage bấm huyệt đả thông kinh lạc cổ vai gáy.',
        image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80',
        categoryName: 'Gội thảo dược & Massage',
        rating: 4.92,
      },
      {
        id: 'spa-3',
        name: 'Massage cổ vai gáy & Đắp khăn nóng thảo mộc',
        price: 100000,
        duration: 30,
        description: 'Liệu trình thư giãn cơ chuyên sâu cho dân văn phòng, đắp khăn ủ tinh dầu bạc hà giảm mỏi tức thì.',
        image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600&auto=format&fit=crop&q=80',
        categoryName: 'Gội thảo dược & Massage',
        rating: 4.89,
      },
    ],
  },
  {
    id: 'perm',
    title: 'Uốn Phồng Định Hình',
    shortTitle: 'Uốn phồng định hình',
    icon: '🎨',
    description: 'Nâng chân tóc bồng bềnh tự nhiên, giữ nếp 3-4 tháng chuẩn style Hàn Quốc',
    keywords: ['uốn', 'nhuộm', 'phồng', 'texture', 'perm', 'color'],
    defaultServices: [
      {
        id: 'perm-1',
        name: 'Uốn tóc Hàn Quốc',
        price: 350000,
        duration: 120,
        description: 'Uốn xoăn nhẹ phong cách Hàn Quốc, tóc bồng bềnh tự nhiên không cứng. Bao gồm dưỡng ẩm sau uốn.',
        image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80',
        categoryName: 'Uốn phồng định hình',
        rating: 4.91,
      },
      {
        id: 'perm-2',
        name: 'Nhuộm tóc thời trang',
        price: 480000,
        duration: 150,
        description: "Nhuộm màu highlight, ombre, balayage với thuốc nhuộm cao cấp Wella/L'Oreal. Tư vấn màu sắc cá nhân.",
        image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600&auto=format&fit=crop&q=80',
        categoryName: 'Uốn phồng định hình',
        rating: 4.87,
      },
      {
        id: 'perm-3',
        name: 'Uốn phồng chân tóc Volume Up',
        price: 280000,
        duration: 90,
        description: 'Kỹ thuật uốn lạnh nâng phồng chân tóc chống bẹp khi đội mũ bảo hiểm, dễ dàng sấy tạo kiểu tại nhà.',
        image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
        categoryName: 'Uốn phồng định hình',
        rating: 4.93,
      },
    ],
  },
  {
    id: 'shave',
    title: 'Cạo Mặt & Chăm Sóc Da',
    shortTitle: 'Cạo mặt & Chăm sóc da',
    icon: '🧔',
    description: 'Quy trình cạo râu cổ điển khăn nóng kết hợp liệu trình chăm sóc da mặt nam chuyên sâu',
    keywords: ['cạo', 'râu', 'da', 'mặt', 'chăm sóc da'],
    defaultServices: [
      {
        id: 'shave-1',
        name: 'Cạo râu cổ điển Straight Razor',
        price: 130000,
        duration: 40,
        description: 'Cạo râu bằng dao cổ điển, kem cạo râu hảo hạng, khăn nóng thư giãn cơ mặt. Trải nghiệm barber đích thực.',
        image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80',
        categoryName: 'Cạo mặt & Chăm sóc da',
        rating: 4.94,
      },
      {
        id: 'shave-2',
        name: 'Chăm sóc da mặt cơ bản',
        price: 200000,
        duration: 75,
        description: 'Làm sạch sâu lỗ chân lông, đắp mặt nạ dưỡng ẩm, tẩy da chết nhẹ nhàng phù hợp da nam.',
        image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&auto=format&fit=crop&q=80',
        categoryName: 'Cạo mặt & Chăm sóc da',
        rating: 4.85,
      },
      {
        id: 'shave-3',
        name: 'Tỉa & tạo hình râu',
        price: 100000,
        duration: 30,
        description: 'Tạo hình râu theo ý muốn, tỉa gọn, làm sạch đường viền. Bao gồm dưỡng beard oil sau tạo kiểu.',
        image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&auto=format&fit=crop&q=80',
        categoryName: 'Cạo mặt & Chăm sóc da',
        rating: 4.88,
      },
    ],
  },
];

// Khách hàng thực tế đánh giá (Social Proof phong cách Fresha)
const TESTIMONIALS = [
  {
    id: 1,
    name: 'Nguyễn Minh Tuấn',
    role: 'Khách hàng thân thiết',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    comment: 'Không gian cực kỳ thoáng đãng, sang trọng. Thợ cắt đúng theo yêu cầu dáng mặt và không phải chờ đợi phút nào nhờ đặt lịch trước qua web!',
    rating: 5,
    service: 'Gentleman Combo 7 Bước',
    date: '3 ngày trước',
  },
  {
    id: 2,
    name: 'Hoàng Quốc Việt',
    role: 'Doanh nhân',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    comment: 'Quy trình đặt lịch rất thông minh như Airbnb. Đến nơi quét mã check-in vào ghế luôn, stylist tư vấn màu nhuộm và kiểu tóc rất có tâm.',
    rating: 5,
    service: 'Uốn Texture & Nhuộm Nâu Lạnh',
    date: '1 tuần trước',
  },
  {
    id: 3,
    name: 'Đặng Thanh Tùng',
    role: 'Designer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    comment: 'Gội đầu thảo dược massage cổ vai gáy đỉnh thực sự, giảm hẳn căng thẳng sau cả ngày ngồi máy tính. 10/10 điểm dịch vụ.',
    rating: 5,
    service: 'Gội Dưỡng Sinh & Spa Da Đầu',
    date: '2 tuần trước',
  },
];

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN').format(price) + 'đ';

const CATEGORY_SHORTCUTS = [
  { id: 'all', title: 'Tất Cả Dịch Vụ', icon: '✂️', count: '30+ gói', action: 'service' },
  { id: 'cut', title: 'Cắt Tóc Nam & Fade', icon: '💇‍♂️', count: '12 gói', targetId: 'service-group-cut' },
  { id: 'perm', title: 'Uốn Form Phồng', icon: '🌀', count: '8 gói', targetId: 'service-group-perm' },
  { id: 'color', title: 'Nhuộm Thời Trang', icon: '🎨', count: '6 gói', targetId: 'service-group-color' },
  { id: 'care', title: 'Gội Dưỡng Sinh & Spa', icon: '💆‍♂️', count: '5 gói', targetId: 'service-group-care' },
  { id: 'shop', title: 'Sáp & Gôm Xịt Tóc', icon: '🛍️', count: 'Grooming', action: 'shop' },
];

export default function HomeContent() {
  const navigate = useNavigate();
  const { authenticated, openLoginModal } = useAuth();
  const { setSelectedServices, setSelectedSalon } = useBooking();

  const [salons, setSalons] = useState([]);
  const [services, setServices] = useState([]);
  const [salonsLoading, setSalonsLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);

  // Bộ lọc thông minh Airbnb / Fresha Search Bar
  const [searchServiceText, setSearchServiceText] = useState('');
  const [selectedSalonId, setSelectedSalonId] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('today');

  // Chỉ cho phép mở DUY NHẤT 1 dropdown tại 1 thời điểm ('service' | 'salon' | 'date' | null)
  const [activeDropdown, setActiveDropdown] = useState(null);
  const searchPillRef = useRef(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchPillRef.current && !searchPillRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lấy danh sách Salon
  useEffect(() => {
    getSalons()
      .then((data) => setSalons(Array.isArray(data) ? data : []))
      .catch(() => setSalons([]))
      .finally(() => setSalonsLoading(false));
  }, []);

  // Lấy danh sách Dịch vụ
  useEffect(() => {
    getServiceOfferings()
      .then((data) => {
        const list = Array.isArray(data) && data.length > 0 ? data : DB_BASELINE_SERVICES;
        setServices(list.map((s, idx) => normalizeService(s, idx)));
      })
      .catch(() => {
        setServices(DB_BASELINE_SERVICES.map((s, idx) => normalizeService(s, idx)));
      })
      .finally(() => setServicesLoading(false));
  }, []);

  const formatTime = (t) => {
    if (!t) return '08:00 - 21:00';
    if (typeof t === 'string') return t;
    if (Array.isArray(t)) return `${String(t[0]).padStart(2, '0')}:${String(t[1]).padStart(2, '0')}`;
    return String(t);
  };

  // Dịch vụ hiển thị
  const displayServices = services.length > 0
    ? services
    : DB_BASELINE_SERVICES.map((s, idx) => normalizeService(s, idx));

  // 4 nhóm dịch vụ tương ứng với 4 loại dịch vụ (Mỗi nhóm có đúng 3 dịch vụ)
  const categoryGroupsWithServices = useMemo(() => {
    return SERVICE_GROUPS.map((group) => {
      const matched = displayServices.filter((s) => {
        const name = (s.name || '').toLowerCase();
        const desc = (s.description || '').toLowerCase();
        const cat = (s.category || s.categoryName || '').toLowerCase();
        return group.keywords.some((kw) => name.includes(kw) || desc.includes(kw) || cat.includes(kw));
      });

      const combined = [...matched];
      group.defaultServices.forEach((def) => {
        if (!combined.some((item) => (item.name || '').toLowerCase() === def.name.toLowerCase())) {
          combined.push(def);
        }
      });

      return {
        ...group,
        services: combined.slice(0, 3),
      };
    });
  }, [displayServices]);

  // Salon hiển thị
  const displaySalons = salons.length > 0 ? salons : [
    {
      id: 'salon-1',
      salonName: 'BachBarber Flagship – Quận 1',
      address: '124 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM',
      openTime: '08:30',
      closeTime: '21:30',
      rating: '4.95',
      reviewsCount: '1.4k',
      distance: '0.8 km',
      image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'salon-2',
      salonName: 'BachBarber Lounge – Cầu Giấy',
      address: '18 Cầu Giấy, Phường Quan Hoa, Cầu Giấy, Hà Nội',
      openTime: '08:30',
      closeTime: '21:30',
      rating: '4.92',
      reviewsCount: '980',
      distance: '1.4 km',
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'salon-3',
      salonName: 'BachBarber Atelier – Đống Đa',
      address: '68 Thái Hà, Phường Trung Liệt, Đống Đa, Hà Nội',
      openTime: '09:00',
      closeTime: '21:00',
      rating: '4.88',
      reviewsCount: '750',
      distance: '2.5 km',
      image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&auto=format&fit=crop&q=80',
    },
  ];

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

  // Xử lý khi nhấn nút tìm kiếm / đặt lịch nhanh ở thanh Fresha Search Pill
  const handlePillSearchSubmit = () => {
    if (selectedSalonId) {
      const foundSalon = displaySalons.find(s => String(s.id) === String(selectedSalonId));
      if (foundSalon) setSelectedSalon(foundSalon);
    }
    if (searchServiceText) {
      const matched = displayServices.find(s => 
        (s.name || '').toLowerCase().includes(searchServiceText.toLowerCase())
      );
      if (matched) setSelectedServices([normalizeService(matched)]);
    }

    if (!authenticated) {
      openLoginModal('Quý khách cần đăng nhập để đặt lịch cuộc hẹn nhanh!', '/booking');
    } else {
      navigate('/booking');
    }
  };

  const [copiedVoucher, setCopiedVoucher] = useState(false);
  const handleCopyVoucher = () => {
    navigator.clipboard.writeText('BACHBARBER20');
    setCopiedVoucher(true);
    setTimeout(() => setCopiedVoucher(false), 2200);
  };

  const handleCategoryClick = (cat) => {
    if (cat.action === 'shop') {
      navigate('/shop');
    } else if (cat.action === 'service') {
      navigate('/service');
    } else if (cat.targetId) {
      const el = document.getElementById(cat.targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        navigate('/service');
      }
    }
  };

  const toggleDropdown = (name) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  return (
    <div className="w-full bg-white text-slate-900 min-h-screen flex flex-col font-sans">

      {/* ── 1. FRESHA & AIRBNB CLEAN HERO SECTION (Không dùng overflow-hidden để không che dropdown) ── */}
      <section className="relative pt-8 pb-14 md:py-16 bg-gradient-to-b from-blue-50/40 via-white to-white border-b border-slate-100">
        <div className="max-w-[1280px] mx-auto px-4 w-full relative z-20">

          {/* Tagline & Trust pill */}
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-xs mb-4 text-xs font-semibold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-[#0099FF] animate-pulse" style={{ backgroundColor: 'var(--primary-color, #0099FF)' }}></span>
              <span>Đẳng cấp dịch vụ Salon & Barber 5 sao</span>
              <span className="text-slate-300">•</span>
              <span className="text-[#0099FF] font-bold" style={{ color: 'var(--primary-color, #0099FF)' }}>Đặt lịch không chờ đợi</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] mb-4">
              Nghệ Thuật Định Hình <br className="hidden sm:inline" />
              <span className="text-[#0099FF]" style={{ color: 'var(--primary-color, #0099FF)' }}>
                Phong Cách & Vẻ Đẹp
              </span>
            </h1>

            <p className="text-slate-600 text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed">
              Trải nghiệm liệu trình cắt tỉa, tạo kiểu và gội dưỡng sinh chuẩn mực quốc tế cùng đội ngũ Master Stylist hàng đầu.
            </p>
          </div>

          {/* ── 2. AIRBNB & FRESHA SIGNATURE SEARCH PILL ────── */}
          <div ref={searchPillRef} className="w-full max-w-4xl mx-auto relative z-30 px-2 sm:px-0">
            <div className="bg-white rounded-2xl md:rounded-full p-2 md:p-2.5 shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-300 flex flex-col md:flex-row items-stretch md:items-center gap-1.5 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-100 overflow-visible">

              {/* Segment 1: Dịch vụ */}
              <div 
                className="flex-1 min-w-0 px-3.5 sm:px-4 py-2.5 md:py-2 text-left cursor-pointer rounded-xl md:rounded-full hover:bg-slate-50 transition relative"
                onClick={() => toggleDropdown('service')}
              >
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <Scissors size={13} className="text-[#0099FF]" style={{ color: 'var(--primary-color, #0099FF)' }} />
                  <span>Dịch vụ</span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-800 truncate mt-0.5">
                  {searchServiceText || 'Cắt tóc, Uốn phồng, Gội spa...'}
                </div>

                {/* Dropdown 1: Dịch vụ (z-[100] siêu cao, không bị che, không tràn màn hình mobile) */}
                {activeDropdown === 'service' && (
                  <div 
                    className="absolute top-full left-0 mt-3 w-[calc(100vw-32px)] sm:w-96 max-w-sm sm:max-w-none bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-[100] divide-y divide-slate-100 text-xs animate-in fade-in zoom-in-95 duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Dịch vụ phổ biến</span>
                      <span className="text-[#0099FF] font-semibold">{displayServices.length} gói</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 pr-1">
                      {displayServices.map((srv) => (
                        <div
                          key={srv.id}
                          onClick={() => {
                            setSearchServiceText(srv.name);
                            setActiveDropdown(null);
                          }}
                          className="p-2.5 hover:bg-blue-50/70 rounded-xl cursor-pointer flex justify-between items-center transition group"
                        >
                          <div>
                            <div className="font-semibold text-slate-800 group-hover:text-[#0099FF]">{srv.name}</div>
                            <div className="text-[10px] text-slate-400">{srv.duration || 45} phút • {srv.categoryName || 'Salon'}</div>
                          </div>
                          <span className="text-[#0099FF] font-bold shrink-0 ml-2" style={{ color: 'var(--primary-color, #0099FF)' }}>
                            {formatPrice(srv.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Segment 2: Salon & Địa điểm */}
              <div 
                className="flex-1 min-w-0 px-3.5 sm:px-4 py-2.5 md:py-2 text-left cursor-pointer rounded-xl md:rounded-full hover:bg-slate-50 transition relative"
                onClick={() => toggleDropdown('salon')}
              >
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <MapPin size={13} className="text-[#0099FF]" style={{ color: 'var(--primary-color, #0099FF)' }} />
                  <span>Cơ sở Salon</span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-800 truncate mt-0.5">
                  {selectedSalonId
                    ? displaySalons.find(s => String(s.id) === String(selectedSalonId))?.salonName || 'Chi nhánh đã chọn'
                    : 'Gần bạn nhất (Quận 1, Cầu Giấy...)'}
                </div>

                {/* Dropdown 2: Cơ sở salon (z-[100], căn giữa pill) */}
                {activeDropdown === 'salon' && (
                  <div 
                    className="absolute top-full left-0 sm:left-1/2 sm:-translate-x-1/2 mt-3 w-[calc(100vw-32px)] sm:w-96 max-w-sm sm:max-w-none bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-[100] divide-y divide-slate-100 text-xs animate-in fade-in zoom-in-95 duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chọn chi nhánh gần bạn</div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 pr-1">
                      {displaySalons.map((salon) => (
                        <div
                          key={salon.id}
                          onClick={() => {
                            setSelectedSalonId(salon.id);
                            setActiveDropdown(null);
                          }}
                          className="p-2.5 hover:bg-blue-50/70 rounded-xl cursor-pointer flex justify-between items-center transition group"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-semibold text-slate-800 group-hover:text-[#0099FF] truncate">{salon.salonName || salon.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{salon.address}</div>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full shrink-0">
                            {salon.distance || '0.8 km'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Segment 3: Thời gian */}
              <div 
                className="flex-1 min-w-0 px-3.5 sm:px-4 py-2.5 md:py-2 text-left cursor-pointer rounded-xl md:rounded-full hover:bg-slate-50 transition relative"
                onClick={() => toggleDropdown('date')}
              >
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <Calendar size={13} className="text-[#0099FF]" style={{ color: 'var(--primary-color, #0099FF)' }} />
                  <span>Thời gian</span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-800 truncate mt-0.5">
                  {selectedDateFilter === 'today' ? 'Hôm nay (Còn slot)' : 'Ngày mai hoặc cuối tuần'}
                </div>

                {/* Dropdown 3: Thời gian (z-[100], căn lề phải pill) */}
                {activeDropdown === 'date' && (
                  <div 
                    className="absolute top-full left-0 sm:left-auto right-0 mt-3 w-[calc(100vw-32px)] sm:w-80 max-w-sm sm:max-w-none bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-[100] text-xs animate-in fade-in zoom-in-95 duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Chọn ngày hẹn</div>
                    <div className="space-y-1.5">
                      <div 
                        onClick={() => { setSelectedDateFilter('today'); setActiveDropdown(null); }}
                        className={`p-3 rounded-xl cursor-pointer flex items-center justify-between border transition ${
                          selectedDateFilter === 'today'
                            ? 'border-blue-500 bg-blue-50/70 text-blue-900 font-bold'
                            : 'border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-slate-900">Hôm nay</div>
                          <div className="text-[10px] text-slate-400">Đặt lịch phục vụ ngay</div>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">Slot sớm nhất: 15:30</span>
                      </div>

                      <div 
                        onClick={() => { setSelectedDateFilter('tomorrow'); setActiveDropdown(null); }}
                        className={`p-3 rounded-xl cursor-pointer flex items-center justify-between border transition ${
                          selectedDateFilter === 'tomorrow'
                            ? 'border-blue-500 bg-blue-50/70 text-blue-900 font-bold'
                            : 'border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-slate-900">Ngày mai</div>
                          <div className="text-[10px] text-slate-400">Khung giờ sáng & chiều</div>
                        </div>
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Trống cả ngày</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button: Search & Book Now */}
              <div className="p-1 shrink-0 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handlePillSearchSubmit}
                  className="w-full md:w-auto px-5 lg:px-6 py-2.5 md:py-3 rounded-xl md:rounded-full text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                  style={{ backgroundColor: 'var(--primary-color, #0099FF)' }}
                >
                  <Search size={16} />
                  <span>Đặt Lịch Ngay</span>
                </button>
              </div>

            </div>
          </div>

          {/* Social Proof Trust Badges (Cân bằng & gọn gàng trực tiếp dưới Search Card) */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-500 pt-8 pb-2">
            <span className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-[#0099FF]" style={{ color: 'var(--primary-color, #0099FF)' }} /> 100% Khách hàng hài lòng</span>
            <span className="flex items-center gap-1.5"><Star size={16} className="text-amber-400 fill-amber-400" /> Đánh giá 4.95★ (3.5k+ lượt)</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-500" /> Không phải chờ đợi một phút nào</span>
          </div>

        </div>
      </section>

      {/* ── 2. TRUST COMMITMENTS & CORE VALUE PROPS (4 CỘT HIỆN ĐẠI) ────── */}
      <section className="relative z-10 -mt-6 sm:-mt-8 max-w-[1280px] mx-auto px-4 w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {/* Card 1 */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-400/50 transition-all duration-200 group flex items-start gap-3 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-50 group-hover:bg-amber-100 text-amber-500 flex items-center justify-center shrink-0 transition-colors">
              <Award size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0099FF] transition-colors leading-tight">
                100% Master Stylist
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-snug">
                Thợ chính 5+ năm tay nghề, tư vấn kiểu tóc chuẩn tỉ lệ gương mặt.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-400/50 transition-all duration-200 group flex items-start gap-3 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 group-hover:bg-blue-100 text-[#0099FF] flex items-center justify-center shrink-0 transition-colors">
              <Zap size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0099FF] transition-colors leading-tight">
                Không Chờ Đợi 1 Phút
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-snug">
                Đến là phục vụ ngay. Cam kết tặng 50k voucher nếu để khách chờ quá 15p.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-400/50 transition-all duration-200 group flex items-start gap-3 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 transition-colors">
              <ShieldCheck size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0099FF] transition-colors leading-tight">
                Bảo Hành Form 7 Ngày
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-snug">
                Chưa ưng ý kiểu tóc? Chỉnh sửa lại hoàn toàn miễn phí hoặc hoàn tiền.
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-400/50 transition-all duration-200 group flex items-start gap-3 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-purple-50 group-hover:bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 transition-colors">
              <Sparkles size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0099FF] transition-colors leading-tight">
                Vô Trùng Chuẩn Y Tế
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-snug">
                Khăn mới, lưỡi dao riêng biệt 100%, khử khuẩn tia UV trước khi làm.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. QUICK CATEGORY PILLS & PROMO VOUCHER BANNER ─────────────── */}
      <section className="pt-8 sm:pt-10 pb-4 max-w-[1280px] mx-auto px-4 w-full">
        {/* Category Discovery Pills */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#0099FF] animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Khám phá nhanh danh mục dịch vụ
            </span>
          </div>
          <button
            onClick={() => navigate('/service')}
            className="text-xs font-bold text-[#0099FF] hover:underline flex items-center gap-1 cursor-pointer"
            style={{ color: 'var(--primary-color, #0099FF)' }}
          >
            <span>Tất cả 30+ dịch vụ</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Quick Filter Horizontal Scroll */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-none no-scrollbar">
          {CATEGORY_SHORTCUTS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat)}
              className="group shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-[#0099FF]/40 text-slate-700 hover:text-[#0099FF] transition-all text-xs font-semibold shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
            >
              <span className="text-sm">{cat.icon}</span>
              <span>{cat.title}</span>
              <span className="text-[10px] text-slate-400 group-hover:text-[#0099FF]/70 font-normal">
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Exclusive Welcome Voucher Banner */}
        <div className="mt-5 relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-sky-600 to-indigo-700 text-white p-5 sm:p-6 md:p-7 shadow-lg">
          {/* Subtle background decoration shapes */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-black/10 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold text-amber-200 border border-white/20 shadow-xs">
                <Gift size={13} className="text-amber-300" />
                <span>ƯU ĐÃI THÀNH VIÊN MỚI</span>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                Giảm 20% Cho Lần Đặt Lịch Đầu Tiên
              </h3>
              <p className="text-xs sm:text-sm text-blue-100 font-medium leading-relaxed">
                Áp dụng cho toàn bộ dịch vụ Cắt Fade, Uốn Định Hình, Nhuộm Thời Trang và Combo Spa tại mọi chi nhánh Salon.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
              <div className="flex items-center justify-between sm:justify-start gap-2 bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/30">
                <div className="text-left">
                  <span className="text-[9px] uppercase tracking-wider text-blue-200 block font-semibold">Mã ưu đãi</span>
                  <span className="text-sm sm:text-base font-black tracking-widest text-amber-300 font-mono">
                    BACHBARBER20
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyVoucher}
                  className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                  title="Sao chép mã"
                >
                  {copiedVoucher ? <Check size={16} className="text-emerald-300" /> : <Copy size={16} />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleBookingClick}
                className="px-5 py-3 rounded-2xl bg-white hover:bg-blue-50 text-[#0099FF] font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer whitespace-nowrap text-center"
                style={{ color: 'var(--primary-color, #0099FF)' }}
              >
                Đặt Lịch & Áp Mã Ngay
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. 4 NHÓM DỊCH VỤ CHỌN LỌC (4 DIV RIÊNG BIỆT - MỖI DIV 1 HÀNG 3 DỊCH VỤ CHO MÀN TO, GIẢM DẦN CHO MOBILE) ── */}
      <section className="py-12 md:py-16 bg-white overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-4 w-full">
          {/* Tiêu đề chung của khu vực Dịch Vụ Chọn Lọc */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0099FF]" style={{ color: 'var(--primary-color, #0099FF)' }}>
                Dịch Vụ Chọn Lọc
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mt-1 tracking-tight">
                Gói Dịch Vụ Được Đặt Nhiều Nhất
              </h2>
            </div>

            <button
              onClick={() => navigate('/service')}
              className="text-xs font-bold text-[#0099FF] hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              style={{ color: 'var(--primary-color, #0099FF)' }}
            >
              <span>Xem toàn bộ 30+ dịch vụ</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* 4 DIV TƯƠNG ỨNG VỚI 4 LOẠI DỊCH VỤ */}
          {servicesLoading ? (
            <div className="space-y-10">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                  <Skeleton active paragraph={{ rows: 3 }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-10 sm:space-y-12">
              {categoryGroupsWithServices.map((group) => (
                <div
                  key={group.id}
                  id={`service-group-${group.id}`}
                  className="bg-slate-50/70 rounded-3xl p-5 sm:p-7 md:p-8 border border-slate-200/80 shadow-2xs hover:border-[#0099FF]/30 transition-all duration-300 scroll-mt-24"
                >
                  {/* Tiêu đề ở mỗi hàng tương ứng với tên thể loại */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-slate-200/70 gap-2">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{group.icon}</span>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                          {group.title}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        {group.description}
                      </p>
                    </div>

                    <button
                      onClick={() => navigate('/service')}
                      className="text-xs font-bold text-[#0099FF] hover:underline flex items-center gap-1 shrink-0 self-start sm:self-auto cursor-pointer"
                      style={{ color: 'var(--primary-color, #0099FF)' }}
                    >
                      <span>Xem thêm</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>

                  {/* Mỗi hàng 3 dịch vụ cho màn to, giảm dần 1 dịch vụ với màn mobile (lg:grid-cols-3 -> sm:grid-cols-2 -> grid-cols-1) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                    {group.services.map((srv) => (
                      <div
                        key={srv.id}
                        className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
                      >
                        <div>
                          {/* Image with Tag */}
                          <div className="h-48 sm:h-52 w-full relative overflow-hidden bg-slate-100">
                            <img
                              src={
                                srv.image ||
                                srv.img ||
                                'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80'
                              }
                              alt={srv.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                              <span>🔥</span>
                              <span>{group.shortTitle}</span>
                            </div>
                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-slate-800 text-xs font-bold px-2 py-1 rounded-full shadow-xs flex items-center gap-1">
                              <Star size={12} className="fill-amber-400 text-amber-400" />
                              <span>{srv.rating || '4.9'}</span>
                            </div>
                          </div>

                          {/* Card Body */}
                          <div className="p-4 sm:p-5">
                            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                              <span className="flex items-center gap-1">
                                <Clock size={12} className="text-[#0099FF]" style={{ color: 'var(--primary-color, #0099FF)' }} />
                                {srv.duration || 45} phút
                              </span>
                              <span>•</span>
                              <span>Tư vấn dáng mặt miễn phí</span>
                            </div>

                            <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug line-clamp-1 mb-2 group-hover:text-[#0099FF] transition-colors">
                              {srv.name}
                            </h4>

                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                              {srv.description || 'Liệu trình chăm sóc tóc chuyên nghiệp chuẩn salon, đem lại diện mạo phong độ và tự tin.'}
                            </p>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2 border-t border-slate-50 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Giá trọn gói</span>
                            <span className="text-base sm:text-lg font-extrabold text-[#0099FF]" style={{ color: 'var(--primary-color, #0099FF)' }}>
                              {formatPrice(srv.price || 150000)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleBookService(srv)}
                            className="px-3.5 sm:px-4 py-2 rounded-xl text-white font-bold text-xs shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
                            style={{ backgroundColor: 'var(--primary-color, #0099FF)' }}
                          >
                            Đặt Lịch Ngay
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 5. HỆ THỐNG SALON GẦN BẠN (AIRBNB EXPERIENCES LAYOUT) ─────────── */}
      <section className="py-12 md:py-16 bg-slate-50 border-t border-b border-slate-100">
        <div className="max-w-[1280px] mx-auto px-4 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0099FF]" style={{ color: 'var(--primary-color, #0099FF)' }}>
                Chi Nhánh Trải Nghiệm
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
                Không Gian Salon Chuẩn 5 Sao Gần Bạn
              </h2>
            </div>
            <button
              onClick={() => navigate('/salons')}
              className="text-xs font-bold text-[#0099FF] hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              style={{ color: 'var(--primary-color, #0099FF)' }}
            >
              <span>Xem chi tiết hệ thống chi nhánh</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {salonsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-2xl p-4 h-64 border border-slate-200">
                  <Skeleton active paragraph={{ rows: 3 }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displaySalons.map((salon, idx) => (
                <div
                  key={salon.id || idx}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Salon Image */}
                    <div className="h-48 w-full overflow-hidden bg-slate-100 relative">
                      <img
                        src={
                          salon.image ||
                          salon.img ||
                          'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&auto=format&fit=crop&q=80'
                        }
                        alt={salon.salonName || salon.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                        ● Đang mở cửa
                      </span>
                      <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded-lg">
                        {salon.distance || '0.8 km'}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold mb-1">
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                        <span>{salon.rating || '4.95'}</span>
                        <span className="text-slate-400 font-normal">({salon.reviewsCount || '1.2k'} đánh giá)</span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">
                        {salon.salonName || salon.name}
                      </h3>

                      <p className="text-xs text-slate-500 flex items-start gap-1.5 mb-2 line-clamp-2 leading-relaxed">
                        <MapPin size={14} className="text-[#0099FF] shrink-0 mt-0.5" style={{ color: 'var(--primary-color, #0099FF)' }} />
                        <span>{salon.address || '18 Cầu Giấy, Hà Nội'}</span>
                      </p>

                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Clock size={13} className="text-slate-400 shrink-0" />
                        <span>
                          {formatTime(salon.openTime)} - {formatTime(salon.closeTime)} hàng ngày
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-2">
                    <button
                      type="button"
                      onClick={() => handleBookSalon(salon)}
                      className="w-full py-2.5 rounded-xl border border-slate-300 hover:border-[#0099FF] hover:bg-blue-50/50 text-slate-800 hover:text-[#0099FF] font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Chọn Chi Nhánh Này</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 6. ĐÁNH GIÁ TỪ KHÁCH HÀNG THỰC TẾ (FRESHA REVIEWS) ───────────── */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 w-full">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0099FF]" style={{ color: 'var(--primary-color, #0099FF)' }}>
              Cộng Đồng Khách Hàng
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
              Khách Hàng Nói Gì Về Chúng Tôi?
            </h2>
            <p className="text-xs text-slate-500 mt-2">
              Hơn 25.000 lượt đặt lịch trực tuyến thành công với tỷ lệ đánh giá hài lòng 4.95/5 sao.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div 
                key={t.id}
                className="bg-slate-50/70 p-6 rounded-2xl border border-slate-100 flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-3">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} size={14} className="fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed mb-4">
                    "{t.comment}"
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-200/60 text-xs">
                  <div className="flex items-center gap-3">
                    <img 
                      src={t.avatar} 
                      alt={t.name} 
                      className="w-10 h-10 rounded-full object-cover border border-slate-200" 
                    />
                    <div>
                      <div className="font-bold text-slate-900">{t.name}</div>
                      <div className="text-[10px] text-slate-400">{t.service}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">{t.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. CLEAN PROMO CTA BANNER (AIRBNB STYLE) ────────────────────── */}
      <section className="pb-16 pt-6">
        <div className="max-w-[1280px] mx-auto px-4 w-full">
          <div 
            className="rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-xl flex flex-col md:flex-row items-center justify-between gap-6"
            style={{ backgroundColor: 'var(--primary-color, #0099FF)' }}
          >
            <div className="max-w-xl text-center md:text-left">
              <span className="text-xs font-bold uppercase tracking-widest text-white/80 px-3 py-1 rounded-full bg-white/10 border border-white/20">
                Ưu Đãi Độc Quyền
              </span>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mt-3 mb-2">
                Giảm 15% Cho Cuộc Hẹn Đầu Tiên
              </h3>
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                Áp dụng mã voucher <strong className="font-mono bg-white text-[#0099FF] px-2 py-0.5 rounded font-bold" style={{ color: 'var(--primary-color, #0099FF)' }}>BACH15</strong> khi đặt lịch trực tuyến hôm nay.
              </p>
            </div>
            <div className="shrink-0 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => navigate('/promotions')}
                className="px-6 py-3.5 bg-white text-[#0099FF] font-bold text-xs sm:text-sm rounded-full shadow-lg hover:bg-slate-50 transition-all transform active:scale-95 cursor-pointer"
                style={{ color: 'var(--primary-color, #0099FF)' }}
              >
                Xem Toàn Bộ Voucher
              </button>
              <button
                type="button"
                onClick={handleBookingClick}
                className="px-6 py-3.5 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs sm:text-sm rounded-full transition-all cursor-pointer"
              >
                Đặt Lịch Ngay
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
