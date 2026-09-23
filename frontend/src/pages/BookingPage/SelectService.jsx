import React, { useState, useEffect, useMemo } from 'react';
import { Spin, Tag, Input, Empty } from 'antd';
import {
  Search,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Trash2,
  Clock,
  Sparkles,
  Scissors,
  X,
} from 'lucide-react';
import { useBooking } from '../../service/context/BookingContext';
import { getServiceOfferings } from '../../service/api/serviceApi';
import { getStylistServices } from '../../service/api/bookingApi';

const DEFAULT_SERVICE_IMAGES = [
  'https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1520338661084-68034fd530bf?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1620331311520-246422fd82f9?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560014022-b52968ed92b0?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570172619644-defd82136e05?w=500&auto=format&fit=crop&q=80',
];

export function SelectService() {
  const { setStep, selectedStylist, selectedServices, setSelectedServices } = useBooking();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isCartExpanded, setIsCartExpanded] = useState(false);

  // Fetch services from backend (prefer stylist services or all services)
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchPromise = selectedStylist?.id
      ? getStylistServices(selectedStylist.id).then((stylistSvcs) => {
          if (Array.isArray(stylistSvcs) && stylistSvcs.length > 0) {
            // Map stylist service DTOs to standard service objects
            return stylistSvcs.map((item) => ({
              id: item.serviceId || item.id,
              name: item.serviceName || item.name,
              price: Number(item.price) || 0,
              duration: item.duration || 30,
              proficiencyLevel: item.proficiencyLevel,
            }));
          }
          return getServiceOfferings();
        })
      : getServiceOfferings();

    fetchPromise
      .then((data) => {
        if (isMounted) {
          const list = Array.isArray(data) ? data : [];
          const normalized = list.map((s, idx) => ({
            id: s.id || s.serviceId,
            name: s.name || s.serviceName || 'Dịch vụ Salon',
            price: Number(s.price) || 0,
            duration: s.duration || 30,
            description: s.description || 'Dịch vụ chăm sóc tóc chuyên nghiệp',
            image: s.image || DEFAULT_SERVICE_IMAGES[idx % DEFAULT_SERVICE_IMAGES.length],
            category: s.categoryName || (s.name && s.name.toLowerCase().includes('uốn') ? 'Uốn & Nhuộm' : s.name && s.name.toLowerCase().includes('massage') ? 'Chăm sóc da' : 'Cắt gội'),
          }));
          setServices(normalized);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching service offerings:', err);
        if (isMounted) {
          setError('Không thể tải danh sách dịch vụ. Vui lòng thử lại!');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedStylist?.id]);

  const toggleService = (srv) => {
    const exists = selectedServices.some((s) => s.id === srv.id);
    if (exists) {
      const updated = selectedServices.filter((s) => s.id !== srv.id);
      setSelectedServices(updated);
      if (updated.length === 0) setIsCartExpanded(false);
    } else {
      setSelectedServices([...selectedServices, srv]);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const totalAmount = useMemo(() => {
    return selectedServices.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  }, [selectedServices]);

  const totalDuration = useMemo(() => {
    return selectedServices.reduce((sum, item) => sum + (Number(item.duration) || 30), 0);
  }, [selectedServices]);

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      if (categoryFilter === 'ALL') return true;
      return s.category === categoryFilter;
    });
  }, [services, searchTerm, categoryFilter]);

  const categories = ['ALL', 'Cắt gội', 'Uốn & Nhuộm', 'Chăm sóc da'];

  return (
    <div className="max-w-[960px] mx-auto px-4 py-6 animate-fade-in pb-32">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1b2a4a] tracking-tight">
          Chọn dịch vụ làm đẹp
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Chọn một hoặc nhiều dịch vụ phù hợp với nhu cầu của bạn
        </p>
      </div>

      {/* Search & Filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm mb-6">
        <Input
          prefix={<Search className="text-gray-400 w-4 h-4 mr-1" />}
          placeholder="Tìm dịch vụ cắt tóc, uốn, gội..."
          size="large"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
          className="rounded-xl mb-3"
        />

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => {
            const isActive = categoryFilter === cat;
            const label = cat === 'ALL' ? 'Tất cả dịch vụ' : cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#1b2a4a] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spin size="large" />
          <p className="text-sm text-gray-400 mt-3 font-medium">Đang tải danh sách dịch vụ...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-red-600 rounded-2xl text-center font-medium">
          {error}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center">
          <Scissors className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 font-medium">Không tìm thấy dịch vụ nào phù hợp</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((srv) => {
            const isSelected = selectedServices.some((s) => s.id === srv.id);

            return (
              <div
                key={srv.id}
                onClick={() => toggleService(srv)}
                className={`group bg-white rounded-2xl overflow-hidden border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 ring-2 ring-blue-100 shadow-md bg-blue-50/20'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="h-44 w-full relative overflow-hidden bg-gray-100">
                    <img
                      src={srv.image}
                      alt={srv.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 bg-[#1b2a4a]/80 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {srv.duration} phút
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white p-1.5 rounded-full shadow-md">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-extrabold text-base text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {srv.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                      {srv.description}
                    </p>
                    <p className="text-lg font-black text-rose-600">
                      {formatPrice(srv.price)}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button
                    type="button"
                    className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-[#1b2a4a] hover:text-white'
                    }`}
                  >
                    {isSelected ? '✓ Đã chọn dịch vụ này' : '+ Chọn dịch vụ'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky Bottom Cart & Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        {/* Overlay when cart expanded */}
        {isCartExpanded && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCartExpanded(false)}
          ></div>
        )}

        <div className="bg-white border-t border-gray-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] rounded-t-3xl relative z-10">
          {/* Expanded Drawer */}
          {isCartExpanded && (
            <div className="max-w-[900px] mx-auto p-4 sm:p-5 max-h-[50vh] overflow-y-auto border-b border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-extrabold text-gray-900 text-sm sm:text-base">
                  Dịch vụ đã chọn ({selectedServices.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setIsCartExpanded(false)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {selectedServices.map((s) => (
                  <div
                    key={s.id}
                    className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200/80"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={s.image}
                        className="w-11 h-11 object-cover rounded-lg"
                        alt={s.name}
                      />
                      <div>
                        <p className="font-bold text-sm text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-500 font-medium">
                          {s.duration} phút
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-rose-600 text-sm">
                        {formatPrice(s.price)}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleService(s)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Bottom Bar */}
          <div className="max-w-[900px] mx-auto p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center justify-between sm:justify-start gap-6 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100 transition-colors flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                Quay lại bước 2
              </button>

              <div
                onClick={() => selectedServices.length > 0 && setIsCartExpanded(!isCartExpanded)}
                className={`flex items-center gap-1.5 font-bold text-xs sm:text-sm select-none transition-colors ${
                  selectedServices.length > 0
                    ? 'text-blue-600 cursor-pointer hover:bg-blue-50 py-1.5 px-3 rounded-xl'
                    : 'text-gray-400'
                }`}
              >
                <span>Đã chọn {selectedServices.length} dịch vụ ({totalDuration}p)</span>
                {selectedServices.length > 0 &&
                  (isCartExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />)}
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
              <div className="text-right">
                <span className="text-[11px] text-gray-500 block">Tổng thanh toán:</span>
                <span className="text-xl font-black text-rose-600 leading-none">
                  {formatPrice(totalAmount)}
                </span>
              </div>

              <button
                type="button"
                disabled={selectedServices.length === 0}
                onClick={() => setStep(4)}
                className={`px-8 py-3 rounded-xl font-extrabold text-sm uppercase transition-all shadow-md flex items-center gap-2 ${
                  selectedServices.length > 0
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transform hover:scale-[1.02]'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Tiếp tục thanh toán
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}