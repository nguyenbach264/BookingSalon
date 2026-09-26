import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Modal, Carousel, message, Breadcrumb, Spin, Empty, Tag } from 'antd';
import { ChevronRight, ChevronLeft, Clock, Sparkles, Scissors, Check } from 'lucide-react';
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
        const list = Array.isArray(data) ? data : [];
        const normalized = list.map((s, idx) => {
          let cat = s.categoryName;
          if (!cat) {
            const nameLower = (s.name || '').toLowerCase();
            if (nameLower.includes('uốn') || nameLower.includes('nhuộm') || nameLower.includes('tẩy')) {
              cat = 'Uốn & Nhuộm Cao Cấp';
            } else if (nameLower.includes('gội') || nameLower.includes('massage') || nameLower.includes('da') || nameLower.includes('dưỡng')) {
              cat = 'Chăm Sóc Da & Thư Giãn';
            } else {
              cat = 'Cắt Tóc & Tạo Kiểu';
            }
          }
          return {
            id: s.id || s.serviceId,
            name: s.name || 'Dịch vụ Salon',
            price: Number(s.price) || 0,
            duration: s.duration || 30,
            time: `${s.duration || 30} phút`,
            description: s.description || 'Dịch vụ chuyên nghiệp chuẩn salon hàng đầu.',
            image: s.image || DEFAULT_SERVICE_IMAGES[idx % DEFAULT_SERVICE_IMAGES.length],
            category: cat,
          };
        });
        setServices(normalized);
      })
      .catch((err) => {
        console.error('Failed to load service offerings:', err);
        setServices([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Lọc dịch vụ theo từ khóa tìm kiếm (nếu có)
  const filteredServices = useMemo(() => {
    if (!searchQuery) return services;
    const q = searchQuery.toLowerCase();
    return services.filter((s) =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q) ||
      (s.category || '').toLowerCase().includes(q)
    );
  }, [services, searchQuery]);

  // Group services by category
  const groupedServices = useMemo(() => {
    const map = {};
    filteredServices.forEach((s) => {
      const cat = s.category || 'Dịch vụ nổi bật';
      if (!map[cat]) map[cat] = [];
      map[cat].push(s);
    });
    return Object.entries(map).map(([category, items]) => ({
      category,
      services: items,
    }));
  }, [filteredServices]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleBookService = (srv) => {
    const target = srv || selectedService;
    if (!target) return;

    const normalizedForBooking = {
      id: target.id,
      name: target.name,
      price: Number(target.price) || 0,
      duration: target.duration || 30,
      description: target.description,
      image: target.image,
      category: target.category,
    };

    // Save into BookingContext so it is already selected in Booking Step 3
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
    <div className="w-full flex-1 bg-gray-50 flex flex-col pb-16">
      {/* Breadcrumb strip */}
      <div className="w-full bg-white py-3 border-b border-gray-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              {
                title: (
                  <span
                    className="text-gray-500 cursor-pointer hover:text-blue-500 transition-colors"
                    onClick={() => navigate('/')}
                  >
                    Trang chủ
                  </span>
                ),
              },
              { title: <span className="text-gray-900 font-medium">Bảng giá dịch vụ</span> },
            ]}
          />
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#60a5fa] border border-blue-200 mb-3">
            <Sparkles size={14} />
            BẢNG GIÁ DỊCH VỤ NIÊM YẾT
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 uppercase tracking-tight">
            Menu Dịch Vụ BachBarber
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto text-sm mt-2">
            Được phục vụ bởi đội ngũ Stylist hàng đầu với quy trình chăm sóc chuyên sâu và thiết bị hiện đại.
          </p>
        </div>

        {/* Banner thông báo kết quả tìm kiếm */}
        {searchQuery && ( 
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 text-sm text-gray-800">
              <Sparkles size={16} className="text-[#60a5fa] shrink-0" />
              <span>
                Kết quả tìm kiếm cho: <strong className="text-[#60a5fa] font-bold">"{searchQuery}"</strong> ({filteredServices.length} dịch vụ)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="self-start sm:self-auto text-xs font-bold text-blue-600 hover:text-blue-800 bg-white hover:bg-blue-50 px-3.5 py-1.5 rounded-xl border border-blue-200 transition-colors shadow-2xs cursor-pointer"
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
            <Empty description="Hiện chưa có dịch vụ nào được cấu hình trong hệ thống." />
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
                className="mt-4 bg-[#60a5fa] hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
              >
                Xem toàn bộ menu dịch vụ
              </button>
            )}
          </div>
        ) : (
          groupedServices.map((cat, idx) => (
            <div key={idx} className="mb-12">
              <div className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-200">
                <div className="w-2.5 h-6 bg-[#60a5fa] rounded-full" />
                <h2 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight mb-0">
                  {cat.category}
                </h2>
                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
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
                          ? 'border-[#60a5fa] ring-2 ring-[#60a5fa]/30 shadow-md'
                          : 'border-gray-200 hover:border-[#60a5fa]'
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
                          <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
                            <Clock size={12} />
                            {srv.time}
                          </span>
                          {isSelected && (
                            <span className="flex items-center gap-1 bg-[#60a5fa] text-white font-bold px-2 py-0.5 rounded-full">
                              <Check size={12} />
                              Đã chọn
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-bold text-gray-800 text-base mb-1 group-hover:text-[#60a5fa] transition-colors line-clamp-2">
                          {srv.name}
                        </h3>
                        <p className="text-gray-500 text-xs line-clamp-2 mb-4">
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
                            className="bg-[#60a5fa] hover:bg-blue-500 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
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
        className="rounded-2xl overflow-hidden"
      >
        {selectedService && (
          <div className="flex flex-col pt-2">
            {/* Modal Carousel with Throttle and Ref */}
            <div className="w-full mb-5 rounded-xl overflow-hidden bg-gray-100 shadow-sm border border-gray-200 relative group select-none">
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

            <span className="text-xs font-semibold text-[#60a5fa] uppercase tracking-wider mb-1">
              {selectedService.category}
            </span>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedService.name}</h3>
            <p className="text-gray-500 text-sm mb-4 leading-relaxed">
              {selectedService.description}
            </p>

            <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100 mb-6">
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
              className="w-full bg-[#60a5fa] hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl text-base transition-all shadow-md hover:shadow-lg active:scale-[0.98] uppercase flex items-center justify-center gap-2 cursor-pointer"
            >
              <Scissors size={18} />
              Đặt lịch dịch vụ này
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}