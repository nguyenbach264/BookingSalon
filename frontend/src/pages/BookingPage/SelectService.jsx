import React, { useState, useEffect } from 'react';
import { Input, Select, } from 'antd';
import { Search, X, User, Trash2, CalendarCheck, MapPin, Check, ArrowLeft, ChevronUp, ChevronDown, Calendar } from 'lucide-react';
import { useBooking } from '../../service/context/BookingContext';

const MOCK_BOOKING_SERVICES = [
  { id: 101, name: 'Shine Combo Cắt Gội Massage', price: 120000, duration: '45 phút', type: 'Cắt tóc', image: 'https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5?auto=format&fit=crop&w=400&q=80' },
  { id: 102, name: 'Cắt tóc tiêu chuẩn', price: 80000, duration: '30 phút', type: 'Cắt tóc', image: 'https://images.unsplash.com/photo-1520338661084-68034fd530bf?auto=format&fit=crop&w=400&q=80' },
  { id: 103, name: 'Uốn tóc nam tiêu chuẩn', price: 250000, duration: '60 phút', type: 'Uốn tóc', image: 'https://images.unsplash.com/photo-1620331311520-246422fd82f9?auto=format&fit=crop&w=400&q=80' },
  { id: 104, name: 'Nhuộm tóc thời trang', price: 300000, duration: '90 phút', type: 'Nhuộm tóc', image: 'https://images.unsplash.com/photo-1560014022-b52968ed92b0?auto=format&fit=crop&w=400&q=80' },
  { id: 105, name: 'Massage mặt + đắp mặt nạ', price: 70000, duration: '20 phút', type: 'Chăm sóc', image: 'https://images.unsplash.com/photo-1570172619644-defd82136e05?auto=format&fit=crop&w=400&q=80' },
];

export function SelectService() {
  const { setStep, selectedServices, setSelectedServices } = useBooking();
  const [isCartExpanded, setIsCartExpanded] = useState(false);

  const toggleService = (srv) => {
    const exists = selectedServices.find(s => s.id === srv.id);
    if (exists) {
      const updated = selectedServices.filter(s => s.id !== srv.id);
      setSelectedServices(updated);
      if (updated.length === 0) setIsCartExpanded(false);
    }
    else setSelectedServices([...selectedServices, srv]);
  };

const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  const totalAmount = selectedServices.reduce((sum, item) => sum + item.price, 0);


  return (
    <div>
      <div className="animate-fade-in">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#1b2a4a]">Chọn dịch vụ</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MOCK_BOOKING_SERVICES.map(srv => {
            const isSelected = selectedServices.some(s => s.id === srv.id);
            return (
              <div
                key={srv.id}
                className={`bg-white rounded-xl overflow-hidden border-2 transition-all cursor-pointer flex flex-col ${isSelected ? 'border-blue-600 shadow-md ring-1 ring-blue-600' : 'border-gray-200 hover:border-blue-400'}`}
                onClick={() => toggleService(srv)}
              >
                <div className="h-48 w-full relative">
                  <img src={srv.image} className="w-full h-full object-cover" alt={srv.name} />
                  <div className="absolute top-2 left-2 bg-[#1b2a4a]/80 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm">{srv.duration}</div>
                  {isSelected && <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full shadow-lg"><Check className="w-4 h-4" /></div>}
                </div>
                <div className="p-4 flex flex-col text-center flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">{srv.name}</h3>
                  <p className="text-red-600 font-bold mb-4">{formatPrice(srv.price)}</p>
                  <div className="mt-auto">
                    <button className={`w-full py-2.5 rounded-lg font-bold text-sm transition-colors ${isSelected ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-[#1b2a4a] text-white hover:bg-[#244383]'}`}>
                      {isSelected ? 'ĐÃ CHỌN DỊCH VỤ NÀY' : 'CHỌN'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
        {/* Overlay when expanded */}
        {isCartExpanded && <div className="absolute inset-0 bg-black/20 -top-[100vh] h-[100vh] pointer-events-auto transition-opacity" onClick={() => setIsCartExpanded(false)}></div>}

        <div className="bg-white border-t border-gray-200 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.2)] rounded-t-2xl pointer-events-auto transform transition-all duration-300 relative">

          {/* Expanded details view */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out bg-gray-50 rounded-t-2xl ${isCartExpanded ? 'max-h-[40vh] border-b border-gray-200' : 'max-h-0'}`}>
            <div className="p-4 max-w-[800px] mx-auto overflow-y-auto max-h-[40vh]">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-gray-800">Dịch vụ đang chọn</h4>
                <button onClick={() => setIsCartExpanded(false)} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                {selectedServices.map(s => (
                  <div key={s.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <img src={s.image} className="w-12 h-12 object-cover rounded-lg" alt="thumb" />
                      <div>
                        <p className="font-bold text-sm text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-500 font-medium">{s.duration}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-red-600">{formatPrice(s.price)}</span>
                      <button onClick={() => toggleService(s)} className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main bottom bar */}
          <div className="max-w-[800px] mx-auto p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1 w-full flex justify-between sm:justify-start sm:gap-8 items-center">
              <div
                onClick={() => selectedServices.length > 0 && setIsCartExpanded(!isCartExpanded)}
                className={`flex items-center gap-1 font-semibold transition-colors ${selectedServices.length > 0 ? 'text-blue-600 cursor-pointer hover:bg-blue-50 py-1.5 px-3 rounded-lg -ml-3' : 'text-gray-400'}`}
              >
                Đã chọn {selectedServices.length} dịch vụ {selectedServices.length > 0 && (isCartExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />)}
              </div>
              <div className="flex flex-col items-end sm:items-start">
                <span className="text-xs text-gray-500 font-medium">Tổng thanh toán</span>
                <span className="text-xl font-black text-red-600 leading-none">{formatPrice(totalAmount)}</span>
              </div>
            </div>
            <button
              disabled={selectedServices.length === 0}
              onClick={() => setStep(4)}
              className="w-full sm:w-auto px-12 bg-[#1b2a4a] text-white hover:bg-[#244383] disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500 font-bold py-3.5 rounded-xl text-lg uppercase transition-all shadow-md transform hover:scale-[1.02] active:scale-95"
            >
              TIẾP TỤC
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}