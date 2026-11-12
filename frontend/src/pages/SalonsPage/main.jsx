import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Phone,
  Star,
  Search,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Skeleton, message } from 'antd';
import { getSalons } from '../../service/api/salonApi';
import { useBooking } from '../../service/context/BookingContext';
import { useAuth } from '../../auth/authProvider';

export default function SalonsPage() {
  const navigate = useNavigate();
  const { setSelectedSalon } = useBooking();
  const { authenticated, openLoginModal } = useAuth();

  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSalonsFromDb = () => {
    setLoading(true);
    setError(null);
    getSalons()
      .then((data) => {
        if (Array.isArray(data)) {
          setSalons(data);
        } else {
          setSalons([]);
        }
      })
      .catch((err) => {
        console.error("Lỗi khi tải danh sách salon từ database:", err);
        setError("Không thể kết nối đến máy chủ để tải dữ liệu salon.");
        message.error("Không thể kết nối đến cơ sở dữ liệu salon!");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSalonsFromDb();
  }, []);

  const handleBookSalon = (salon) => {
    if (salon) {
      setSelectedSalon(salon);
    }
    if (!authenticated) {
      openLoginModal('Quý khách cần đăng nhập để đặt lịch dịch vụ!', '/booking');
    } else {
      navigate('/booking');
    }
  };

  // Trích xuất danh sách thành phố thực tế từ database
  const availableCities = React.useMemo(() => {
    const citySet = new Set();
    salons.forEach((s) => {
      if (s.city && s.city.trim()) {
        citySet.add(s.city.trim());
      }
    });
    return Array.from(citySet);
  }, [salons]);

  const filteredSalons = salons.filter((s) => {
    const name = (s.salonName || s.name || '').toLowerCase();
    const addr = (s.address || '').toLowerCase();
    const city = (s.city || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || name.includes(q) || addr.includes(q) || city.includes(q);

    if (selectedCity === 'ALL') return matchQuery;
    return matchQuery && (s.city || '').toLowerCase() === selectedCity.toLowerCase();
  });

  const formatTime = (timeStr) => {
    if (!timeStr) return '--:--';
    return String(timeStr).slice(0, 5);
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen py-8 font-sans">
      <div className="max-w-[1280px] mx-auto px-4">
        
        {/* Breadcrumb & Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <span className="hover:text-slate-600 cursor-pointer" onClick={() => navigate('/')}>Trang chủ</span>
            <span>/</span>
            <span className="text-slate-700 font-semibold">Hệ thống Salon</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0099FF]" style={{ color: 'var(--primary-color, #0099FF)' }}>
                Hệ Thống Chi Nhánh ({salons.length} cơ sở từ Database)
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mt-1">
                Không Gian Trải Nghiệm Chuẩn 5 Sao
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                Dữ liệu cơ sở salon được đồng bộ trực tiếp từ hệ thống. Chọn chi nhánh gần bạn nhất để được phục vụ tốt nhất.
              </p>
            </div>
            
            {/* Dynamic City Filters from Database */}
            {availableCities.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedCity('ALL')}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
                    selectedCity === 'ALL'
                      ? 'text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                  style={selectedCity === 'ALL' ? { backgroundColor: 'var(--primary-color, #0099FF)' } : {}}
                >
                  Tất Cả ({salons.length})
                </button>
                {availableCities.map((c) => {
                  const count = salons.filter((s) => s.city === c).length;
                  const isSelected = selectedCity.toLowerCase() === c.toLowerCase();
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedCity(c)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
                        isSelected
                          ? 'text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                      style={isSelected ? { backgroundColor: 'var(--primary-color, #0099FF)' } : {}}
                    >
                      {c} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs mb-8 flex items-center gap-3">
          <Search size={18} className="text-slate-400 ml-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên chi nhánh, số nhà, đường, quận hoặc thành phố..."
            className="w-full text-xs sm:text-sm text-slate-800 bg-transparent focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-slate-600 px-2 cursor-pointer"
            >
              Xóa
            </button>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center max-w-md mx-auto mb-8">
            <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 mb-1">Không thể tải dữ liệu Salon</h3>
            <p className="text-xs text-slate-600 mb-4">{error}</p>
            <button
              onClick={fetchSalonsFromDb}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-bold text-xs shadow-xs"
              style={{ backgroundColor: 'var(--primary-color, #0099FF)' }}
            >
              <RefreshCw size={14} />
              <span>Thử lại</span>
            </button>
          </div>
        )}

        {/* Salons List Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
                <Skeleton active paragraph={{ rows: 5 }} />
              </div>
            ))}
          </div>
        ) : filteredSalons.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto">
            <div className="text-4xl mb-3">📍</div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Không tìm thấy chi nhánh phù hợp</h3>
            <p className="text-xs text-slate-500 mb-4">Vui lòng thử tìm kiếm với từ khóa khác hoặc chuyển bộ lọc thành phố.</p>
            <button
              onClick={() => { setSelectedCity('ALL'); setSearchQuery(''); }}
              className="text-xs font-bold text-[#0099FF] cursor-pointer"
              style={{ color: 'var(--primary-color, #0099FF)' }}
            >
              Xem tất cả ({salons.length}) chi nhánh
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSalons.map((salon) => {
              const photo =
                salon.images && salon.images.length > 0
                  ? salon.images[0]
                  : 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop&q=80';
              const isAvailable = salon.enabled !== false;
              const phone = salon.phoneNumber || salon.phone || '0901234567';

              return (
                <div
                  key={salon.id}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Photo Banner */}
                    <div className="h-56 w-full overflow-hidden bg-slate-100 relative">
                      <img
                        src={photo}
                        alt={salon.salonName || salon.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold shadow-xs flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                          }`}
                        ></span>
                        <span className={isAvailable ? 'text-emerald-700' : 'text-rose-700'}>
                          {isAvailable ? 'Đang mở cửa' : 'Tạm đóng cửa'}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl text-white text-xs font-bold flex items-center gap-1">
                        <Star size={13} className="text-amber-400 fill-amber-400" />
                        <span>5.0</span>
                      </div>
                    </div>

                    {/* Body Content */}
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-lg font-black text-slate-900 leading-snug">
                          {salon.salonName || salon.name}
                        </h3>
                        {salon.city && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 shrink-0">
                            {salon.city}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 flex items-start gap-2 mb-2.5 leading-relaxed">
                        <MapPin size={16} className="text-[#0099FF] shrink-0 mt-0.5" style={{ color: 'var(--primary-color, #0099FF)' }} />
                        <span>{salon.address}</span>
                      </p>

                      <p className="text-xs text-slate-500 flex items-center gap-2 mb-2.5">
                        <Clock size={15} className="text-slate-400 shrink-0" />
                        <span>{formatTime(salon.openTime)} - {formatTime(salon.closeTime)} (Cả tuần)</span>
                      </p>

                      <p className="text-xs text-slate-500 flex items-center gap-2 mb-4">
                        <Phone size={15} className="text-slate-400 shrink-0" />
                        <a href={`tel:${phone}`} className="text-slate-700 hover:text-[#0099FF] font-medium transition-colors">
                          {phone}
                        </a>
                      </p>

                      {/* Map & Direction link */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((salon.salonName || '') + ' ' + (salon.address || ''))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#0099FF] hover:underline font-semibold"
                          style={{ color: 'var(--primary-color, #0099FF)' }}
                        >
                          <ExternalLink size={13} />
                          <span>Xem trên Google Maps</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="p-6 pt-0">
                    <button
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => handleBookSalon(salon)}
                      className={`w-full py-3 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 ${
                        isAvailable ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed bg-slate-400'
                      }`}
                      style={isAvailable ? { backgroundColor: 'var(--primary-color, #0099FF)' } : {}}
                    >
                      <span>{isAvailable ? 'Đặt Lịch Tại Chi Nhánh Này' : 'Chi nhánh tạm đóng'}</span>
                      {isAvailable && <ChevronRight size={16} />}
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
