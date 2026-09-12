import React, { useState, useEffect } from 'react';
import { Modal, Carousel, message, Breadcrumb } from 'antd';
import { ChevronRight, ChevronLeft, } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const mockServiceImages = [
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1620331317312-74b88bf40907?w=600&auto=format&fit=crop&q=80'
];

const MOCK_DETAILED_SERVICES = [
  {
    category: "Cắt tóc",
    services: [
      { name: "Cắt tóc tiêu chuẩn", time: "30 phút", price: 60000, image: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=500&auto=format&fit=crop&q=60" },
      { name: "Cắt tóc VIP", time: "45 phút", price: 100000, image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&auto=format&fit=crop&q=60" },
      { name: "Cắt tóc + Gội", time: "60 phút", price: 150000, image: "https://images.unsplash.com/photo-1620331317312-74b88bf40907?w=500&auto=format&fit=crop&q=60" },
      { name: "Cắt tóc VIP", time: "45 phút", price: 100000, image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&auto=format&fit=crop&q=60" }
    ]
  },
  {
    category: "Uốn tóc",
    services: [
      { name: "Uốn phồng Hàn Quốc", time: "90 phút", price: 250000, image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=60" },
      { name: "Uốn xoăn Ruffled", time: "120 phút", price: 350000, image: "https://images.unsplash.com/photo-1599305090598-fe179d501227?w=500&auto=format&fit=crop&q=60" },
      { name: "Uốn Pre-lock", time: "150 phút", price: 450000, image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=500&auto=format&fit=crop&q=60" }
    ]
  },
  {
    category: "Nhuộm tóc",
    services: [
      { name: "Nhuộm đen phủ bạc", time: "45 phút", price: 150000, image: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=500&auto=format&fit=crop&q=60" },
      { name: "Nhuộm thời trang (Không tẩy)", time: "60 phút", price: 250000, image: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=500&auto=format&fit=crop&q=60" },
      { name: "Nhuộm màu sáng (Có tẩy)", time: "120 phút", price: 500000, image: "https://images.unsplash.com/photo-1585232004423-244e0e6904e3?w=500&auto=format&fit=crop&q=60" },
      { name: "Nhuộm đen phủ bạc", time: "45 phút", price: 150000, image: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=500&auto=format&fit=crop&q=60" },
      { name: "Nhuộm thời trang (Không tẩy)", time: "60 phút", price: 250000, image: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=500&auto=format&fit=crop&q=60" },
      { name: "Nhuộm màu sáng (Có tẩy)", time: "120 phút", price: 500000, image: "https://images.unsplash.com/photo-1585232004423-244e0e6904e3?w=500&auto=format&fit=crop&q=60" }
    ]
  }, 
];

export default function ServicePage() {
  const [selectedService, setSelectedService] = useState(null);
  const navigate = useNavigate();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleBookService = () => {
    navigate("/booking");
    message.success(`Đã đặt lịch thành công dịch vụ: ${selectedService.name}`);
    setSelectedService(null);
  };

  const CustomArrow = ({ direction, onClick }) => (
    <div
      className={`absolute top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white/70 hover:bg-white text-gray-800 rounded-full shadow-md cursor-pointer transition-all ${direction === 'left' ? 'left-2' : 'right-2'}`}
      onClick={onClick}
    >
      {direction === 'left' ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
    </div>
  );


  return (
    <div className="w-full flex-1 bg-gray-50 flex flex-col pb-16">
      <div className="w-full bg-white py-3 border-b border-gray-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              {
                title: <span
                  className="text-gray-500 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => navigate("/")}>Trang chủ</span>
              },
              { title: <span className="text-gray-900 font-medium">Bảng giá dịch vụ</span> }
            ]}
          />
        </div>
      </div>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <h1 className="text-3xl font-bold mb-10 text-center text-gray-900 uppercase">Bảng Giá Chi Tiết</h1>
        {MOCK_DETAILED_SERVICES.map((cat, idx) => (
          <div key={idx} className="mb-10">
            <h2 className="text-xl font-bold mb-6 text-gray-800">{cat.category}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {cat.services.map((srv, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedService(srv)}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-blue-500 hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col"
                >
                  <div className="h-40 w-full overflow-hidden bg-gray-100 relative">
                    <img src={srv.image} alt={srv.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
                  </div>
                  <div className="p-5 flex flex-col items-center justify-center text-center flex-1">
                    <h3 className="font-semibold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[48px]">{srv.name}</h3>
                    <div className="flex flex-wrap justify-center items-center gap-2 text-sm mt-auto">
                      <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded">{srv.time}</span>
                      <span className="text-gray-400">-</span>
                      <span className="font-bold text-red-600 text-base">{formatPrice(srv.price)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={!!selectedService}
        onCancel={() => setSelectedService(null)}
        footer={null}
        centered
        width={480}
        scrollLock={false}
        className="rounded-xl overflow-hidden"
      >
        {selectedService && (
          <div className="flex flex-col pt-4">
            <div className="w-full mb-5 rounded-lg overflow-hidden bg-gray-100 shadow-sm border border-gray-200 relative group select-none">
              <Carousel
                autoplay={false}
                draggable
                swipeToSlide
                dots={true}
                arrows={true}
                prevArrow={<CustomArrow direction="left" />}
                nextArrow={<CustomArrow direction="right" />}
                className="custom-dots"
              >
                {[selectedService.image, ...mockServiceImages].map((img, idx) => (
                  <div key={idx} className="w-full outline-none">
                    <div className="h-[250px] w-full cursor-grab active:cursor-grabbing">
                      <img src={img} alt="service" className="w-full h-full object-cover pointer-events-none" />
                    </div>
                  </div>
                ))}
              </Carousel>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-3">{selectedService.name}</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1.5 text-gray-600 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-md font-medium text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {selectedService.time}
              </div>
              <div className="text-2xl font-black text-red-600">
                {formatPrice(selectedService.price)}
              </div>
            </div>

            <button
              onClick={handleBookService}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg text-base transition-colors shadow-md uppercase flex items-center justify-center gap-2"
            >
              Đặt lịch ngay
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};