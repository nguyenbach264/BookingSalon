import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Modal, Carousel, message, Spin, Empty } from 'antd';
import { ChevronRight, ChevronLeft, Clock, Sparkles, Scissors, Check, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/authProvider';
import { useBooking } from '../../service/context/BookingContext';
import { getServiceOfferings } from '../../service/api/serviceApi';

const DEFAULT_SERVICE_IMAGES = [
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1620331317312-74b88bf40907?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80',
];

import { DB_BASELINE_SERVICES, normalizeService } from '../../service/baselineServices';

export default function ServicePage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = (searchParams.get('search') || '').trim();

  const { authenticated, openLoginModal } = useAuth();
  const { setSelectedServices, selectedServices } = useBooking();

  const modalCarouselRef = useRef(null);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getServiceOfferings()
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) && data.length > 0 ? data : DB_BASELINE_SERVICES;
        const normalized = list.map((s, idx) => normalizeService(s, idx));
        setServices(normalized);
      })
      .catch((err) => {
        console.warn('Failed to load service offerings, using baseline:', err);
        if (isMounted) {
          const normalized = DB_BASELINE_SERVICES.map((s, idx) => normalizeService(s, idx));
          setServices(normalized);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredServices = useMemo(() => {
    if (!searchQuery) return services;
    const q = searchQuery.toLowerCase();
    return services.filter(
      (s) =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q) ||
        (s.category || '').toLowerCase().includes(q)
    );
  }, [services, searchQuery]);

  const groupedServices = useMemo(() => {
    const map = {};
    filteredServices.forEach((s) => {
      const cat = s.category || 'Cắt tóc';
      if (!map[cat]) map[cat] = [];
      map[cat].push(s);
    });

    const categoryTitles = {
      'Cắt tóc': 'Cắt Tóc & Tạo Kiểu',
      'Uốn/Nhuộm': 'Uốn & Nhuộm Cao Cấp',
      'Spa & Dưỡng sinh': 'Chăm Sóc Da & Thư Giãn',
    };

    return Object.entries(map).map(([catKey, items]) => ({
      categoryKey: catKey,
      category: categoryTitles[catKey] || catKey,
      services: items,
    }));
  }, [filteredServices]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleBookService = (srv) => {
    const target = srv || selectedService;
    if (!target) return;

    const normalizedForBooking = normalizeService(target);

    setSelectedServices([normalizedForBooking]);
    setSelectedService(null);

    if (!authenticated) {
      openLoginModal('Quý khách cần đăng nhập tài khoản để thực hiện đặt lịch dịch vụ!', '/booking');
      return;
    }

    message.success(`Đã chọn dịch vụ: ${normalizedForBooking.name}`);
    navigate('/booking');
  };

  const handleModalPrev = (e) => {
    e?.stopPropagation();
    if (isAnimatingRef.current) return;
    modalCarouselRef.current?.prev();
  };

  const handleModalNext = (e) => {
    e?.stopPropagation();
    if (isAnimatingRef.current) return;
    modalCarouselRef.current?.next();
  };

  return (
    <div className="w-full flex-1 bg-gray-50 flex flex-col pb-20">
      <div className="max-w-[1280px] mx-auto px-4 py-12 w-full flex-1">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 text-[#2563eb] bg-blue-50 border border-blue-100 px-3.5 py-1.5 rounded-full text-xs font-bold mb-3">
            <Sparkles size={13} className="text-[#60a5fa]" /> Bảng giá & Dịch vụ chuẩn Salon
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Menu Dịch Vụ BachBarber
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto text-sm mt-2 leading-relaxed">
            Được phục vụ bởi đội ngũ Stylist hàng đầu với quy trình chăm sóc chuyên sâu và thiết bị hiện đại.
          </p>
        </div>

        {/* Banner thông báo kết quả tìm kiếm */}
        {searchQuery && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 text-sm text-gray-800">
              <Sparkles size={16} className="text-[#60a5fa] shrink-0" />
              <span>
                Kết quả tìm kiếm cho: <strong className="text-[#2563eb] font-bold">"{searchQuery}"</strong> ({filteredServices.length} dịch vụ)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="self-start sm:self-auto text-xs font-bold text-[#2563eb] hover:text-blue-800 bg-white hover:bg-blue-50 px-3.5 py-1.5 rounded-xl border border-blue-200 transition-colors shadow-2xs cursor-pointer"
            >
              Xóa bộ lọc & Xem tất cả
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Spin size="large" tip="Đang tải menu dịch vụ..." />
          </div>
        ) : groupedServices.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <Empty
              description={
                searchQuery
                  ? `Không tìm thấy dịch vụ nào phù hợp với từ khóa "${searchQuery}"`
                  : 'Hiện chưa có dịch vụ nào được cấu hình trong hệ thống.'
              }
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchParams({})}
                className="mt-4 bg-[#60a5fa] hover:bg-[#3b82f6] text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
              >
                Xem toàn bộ menu dịch vụ
              </button>
            )}
          </div>
        ) : (
          groupedServices.map((cat, idx) => (
            <div key={idx} className="mb-14">
              <div className="flex items-center gap-3 mb-6 pb-2.5 border-b border-gray-200">
                <div className="w-2.5 h-6 bg-[#60a5fa] rounded-full" />
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mb-0">
                  {cat.category}
                </h2>
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                  {cat.services.length} dịch vụ
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {cat.services.map((srv) => {
                  const isSelected = selectedServices.some((s) => s.id === srv.id);
                  return (
                    <div
                      key={srv.id}
                      onClick={() => setSelectedService(srv)}
                      className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer group flex flex-col hover:shadow-xl hover:-translate-y-1 ${
                        isSelected
                          ? 'border-[#60a5fa] ring-4 ring-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-[#60a5fa]/50'
                      }`}
                    >
                      <div className="h-44 w-full overflow-hidden bg-gray-100 relative">
                        <img
                          src={srv.image}
                          alt={srv.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                          <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-0.5 rounded-full">
                            <Clock size={12} className="text-[#60a5fa]" />
                            {srv.time}
                          </span>
                          {isSelected && (
                            <span className="flex items-center gap-1 bg-[#60a5fa] text-white font-bold px-2 py-0.5 rounded-full shadow-sm">
                              <Check size={12} strokeWidth={2.5} />
                              Đã chọn
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-[#2563eb] transition-colors line-clamp-2">
                          {srv.name}
                        </h3>
                        <p className="text-gray-500 text-xs line-clamp-2 mb-4 leading-relaxed">
                          {srv.description}
                        </p>

                        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                          <span className="font-black text-[#60a5fa] text-lg">
                            {formatPrice(srv.price)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookService(srv);
                            }}
                            className="bg-[#60a5fa] hover:bg-[#3b82f6] text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition-all shadow-sm shadow-blue-200 hover:shadow active:scale-95 cursor-pointer"
                          >
                            Đặt lịch
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        open={!!selectedService}
        onCancel={() => setSelectedService(null)}
        footer={null}
        centered
        width={480}
        className="rounded-3xl overflow-hidden"
      >
        {selectedService && (
          <div className="flex flex-col pt-2">
            <div className="w-full mb-5 rounded-2xl overflow-hidden bg-gray-100 shadow-sm border border-gray-200 relative group select-none">
              <button
                type="button"
                onClick={handleModalPrev}
                aria-label="Previous slide"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white cursor-pointer backdrop-blur-sm transition-all shadow-md"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={handleModalNext}
                aria-label="Next slide"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white cursor-pointer backdrop-blur-sm transition-all shadow-md"
              >
                <ChevronRight size={18} />
              </button>

              <Carousel
                ref={modalCarouselRef}
                autoplay={false}
                speed={400}
                waitForAnimate={true}
                draggable
                swipeToSlide
                dots={true}
                arrows={false}
                beforeChange={() => {
                  isAnimatingRef.current = true;
                }}
                afterChange={() => {
                  isAnimatingRef.current = false;
                }}
                className="custom-dots"
              >
                {[selectedService.image, ...DEFAULT_SERVICE_IMAGES.slice(0, 2)].map((img, idx) => (
                  <div key={idx} className="w-full outline-none">
                    <div className="h-[250px] w-full">
                      <img
                        src={img}
                        alt="service"
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    </div>
                  </div>
                ))}
              </Carousel>
            </div>

            <span className="text-xs font-semibold text-[#2563eb] uppercase tracking-wider mb-1">
              {selectedService.category}
            </span>
            <h3 className="text-xl font-black text-gray-900 mb-2">{selectedService.name}</h3>
            <p className="text-gray-500 text-sm mb-4 leading-relaxed">
              {selectedService.description}
            </p>

            <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100 mb-6">
              <div className="flex items-center gap-1.5 text-gray-600 font-medium text-sm">
                <Clock size={16} className="text-[#60a5fa]" />
                Thời lượng: {selectedService.time}
              </div>
              <div className="text-2xl font-black text-[#60a5fa]">
                {formatPrice(selectedService.price)}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleBookService(selectedService)}
              className="w-full bg-[#60a5fa] hover:bg-[#3b82f6] text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md shadow-blue-200 hover:shadow-lg active:scale-[0.98] uppercase flex items-center justify-center gap-2 cursor-pointer"
            >
              <Scissors size={18} />
              Đặt lịch ngay
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}