import React, { useState, useEffect } from 'react';
import { Input, Spin, Empty, Tag } from 'antd';
import { Search, MapPin, Clock, Phone, Check, ChevronRight, Sparkles, Building2 } from 'lucide-react';
import { useBooking } from '../../service/context/BookingContext';
import { getSalons } from '../../service/api/salonApi';

const DEFAULT_SALON_IMAGES = [
  'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&auto=format&fit=crop&q=80',
];

const SelectSalon = () => {
  const { selectedSalon, setSelectedSalon, setStep } = useBooking();
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getSalons()
      .then((data) => {
        if (isMounted) {
          setSalons(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching salons:', err);
        if (isMounted) {
          setError('Không thể tải danh sách chi nhánh salon. Vui lòng thử lại!');
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter logic
  const filteredSalons = salons.filter((salon) => {
    const matchesSearch =
      (salon.salonName || salon.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (salon.address || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (cityFilter === 'ALL') return true;

    const salonCity = (salon.city || '').toLowerCase();
    const filterKey = cityFilter.toLowerCase();
    return salonCity.includes(filterKey) || (filterKey === 'hn' && (salonCity.includes('hà nội') || salonCity.includes('ha noi'))) ||
           (filterKey === 'hcm' && (salonCity.includes('hồ chí minh') || salonCity.includes('ho chi minh') || salonCity.includes('sài gòn'))) ||
           (filterKey === 'dn' && (salonCity.includes('đà nẵng') || salonCity.includes('da nang')));
  });

  const getSalonImage = (salon, index) => {
    if (salon.images && salon.images.length > 0 && salon.images[0]) {
      return salon.images[0];
    }
    return DEFAULT_SALON_IMAGES[index % DEFAULT_SALON_IMAGES.length];
  };

  const handleSelect = (salon) => {
    setSelectedSalon(salon);
  };

  const handleConfirmAndNext = (salon) => {
    setSelectedSalon(salon);
    setStep(2);
  };

  return (
    <div className="max-w-[920px] mx-auto px-4 py-6 animate-fade-in">
      {/* Header Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Hệ thống Salon chuẩn quốc tế
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1b2a4a] tracking-tight">
          Chọn chi nhánh Salon
        </h1>
        <p className="text-gray-500 text-sm mt-1.5">
          Vui lòng chọn salon thuận tiện nhất để tiếp tục đặt lịch hẹn
        </p>
      </div>

      {/* Search & City Filter */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-200/80 mb-6">
        <Input
          prefix={<Search className="text-gray-400 w-4 h-4 mr-1" />}
          placeholder="Tìm theo tên salon, đường, quận..."
          size="large"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
          className="rounded-xl mb-4 font-normal"
        />

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { id: 'ALL', name: 'Tất cả khu vực' },
            { id: 'HN', name: 'Hà Nội' },
            { id: 'HCM', name: 'TP. Hồ Chí Minh' },
            { id: 'DN', name: 'Đà Nẵng' },
          ].map((city) => {
            const isActive = cityFilter === city.id;
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => setCityFilter(city.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-[#1b2a4a] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70 hover:text-gray-900'
                }`}
              >
                {city.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Salons List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Spin size="large" />
          <p className="mt-4 text-gray-500 text-sm font-medium">Đang tải danh sách salon...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 font-medium">
          {error}
          <button
            onClick={() => window.location.reload()}
            className="block mx-auto mt-3 px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm"
          >
            Tải lại
          </button>
        </div>
      ) : filteredSalons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Không tìm thấy chi nhánh salon nào phù hợp</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setCityFilter('ALL');
            }}
            className="mt-3 text-sm text-blue-600 hover:underline font-semibold"
          >
            Xóa bộ lọc tìm kiếm
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSalons.map((salon, idx) => {
            const isSelected = selectedSalon?.id === salon.id;
            const salonName = salon.salonName || salon.name || 'Salon 30Shine';
            const salonAddress = salon.address || 'Đang cập nhật địa chỉ';
            const openHour = salon.openTime ? String(salon.openTime).slice(0, 5) : '08:30';
            const closeHour = salon.closeTime ? String(salon.closeTime).slice(0, 5) : '21:30';
            const imgUrl = getSalonImage(salon, idx);

            return (
              <div
                key={salon.id || idx}
                onClick={() => handleSelect(salon)}
                className={`group bg-white rounded-2xl border-2 transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'border-blue-600 ring-2 ring-blue-100 shadow-md bg-blue-50/20'
                    : 'border-gray-200/90 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                {/* Selected Badge */}
                {isSelected && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-[11px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-sm">
                    <Check className="w-3.5 h-3.5 stroke-[3]" /> Đã chọn
                  </div>
                )}

                <div>
                  <div className="flex gap-4 items-start">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative">
                      <img
                        src={imgUrl}
                        alt={salonName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-1 leading-snug group-hover:text-blue-600 transition-colors">
                        {salonName}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 mb-2 flex items-start gap-1.5 line-clamp-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span>{salonAddress}</span>
                      </p>

                      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                        <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md font-medium text-[11px]">
                          <Clock className="w-3 h-3 text-gray-500" /> {openHour} - {closeHour}
                        </span>
                        {salon.phoneNumber && (
                          <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md font-medium text-[11px]">
                            <Phone className="w-3 h-3 text-gray-500" /> {salon.phoneNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">
                    {salon.city || 'Việt Nam'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConfirmAndNext(salon);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-[#1b2a4a] hover:text-white'
                    }`}
                  >
                    {isSelected ? 'Tiếp tục bước 2' : 'Chọn salon này'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky Bottom Bar if a salon is selected */}
      {selectedSalon && (
        <div className="sticky bottom-4 mt-8 z-10">
          <div className="bg-[#1b2a4a] text-white p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-blue-900/50">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="truncate">
                <p className="text-xs text-blue-200">Salon đang chọn:</p>
                <p className="text-sm sm:text-base font-bold text-white truncate">
                  {selectedSalon.salonName || selectedSalon.name}
                </p>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              Tiếp tục chọn Stylist & Ngày giờ
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectSalon;