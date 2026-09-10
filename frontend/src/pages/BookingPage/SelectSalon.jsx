import React, { useState, useEffect } from 'react';
import { Input, Select, } from 'antd';
import { Search, X, User, Trash2, CalendarCheck, MapPin, Check, ArrowLeft, ChevronUp, ChevronDown, Calendar } from 'lucide-react';
import { useBooking } from '../../service/context/BookingContext';
import { useNavigate } from 'react-router';

const MOCK_SALONS = [
  { id: 1, name: '30Shine - Vinsmart City Parking Zone 4', address: 'Tây Mỗ, Nam Từ Liêm, Hà Nội', features: ['Đậu ô tô', 'Gần anh'], image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400&q=80', city: 'hn' },
  { id: 2, name: '30Shine - 65 Cầu Diễn', address: 'Phúc Diễn, Bắc Từ Liêm, Hà Nội', features: ['Đậu ô tô', 'Studio gội riêng'], image: 'https://images.unsplash.com/photo-1588772097746-86c879dc6eb9?w=400&q=80', city: 'hn' },
  { id: 6, name: '30Shine - 104 Thái Hà', address: 'Trung Liệt, Đống Đa, Hà Nội', features: ['Massage VIP', 'Trung tâm'], image: 'https://images.unsplash.com/photo-1598524374912-628cbcddbc1f?w=400&q=80', city: 'hn' },
  { id: 3, name: '30Shine - 136 Hùng Vương', address: 'Phường 4, Quận 10, TP. Hồ Chí Minh', features: ['Đậu ô tô', 'Gội VIP'], image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80', city: 'hcm' },
  { id: 4, name: '30Shine - 2 Nguyễn Trãi', address: 'Phường 3, Quận 5, TP. Hồ Chí Minh', features: ['Gần anh', 'Đậu ô tô'], image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&q=80', city: 'hcm' },
  { id: 7, name: '30Shine - 82 Lê Trọng Tấn', address: 'Tây Thạnh, Tân Phú, TP. Hồ Chí Minh', features: ['Không gian rộng'], image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80', city: 'hcm' },
  { id: 5, name: '30Shine - 345 Lê Duẩn', address: 'Hải Châu, Đà Nẵng', features: ['Đậu ô tô'], image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&q=80', city: 'dn' },
  { id: 8, name: '30Shine - 71 Nguyễn Văn Linh', address: 'Thạc Gián, Thanh Khê, Đà Nẵng', features: ['Mặt tiền lớn'], image: 'https://images.unsplash.com/photo-1516975080661-46bfa33f93a1?w=400&q=80', city: 'dn' },
  { id: 9, name: '30Shine - 163 Hàng Bông', province: 'Hà Nội', address: '163 Hàng Bông, Hoàn Kiếm, Hà Nội', features: ['Gần bạn', 'Đậu ô tô'], image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=400&q=80' },
  { id: 10, name: '30Shine - 346 Khâm Thiên', province: 'Hà Nội', address: '346 Khâm Thiên, Đống Đa, Hà Nội', features: ['Studio gội riêng'], image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=400&q=80' },
  { id: 12, name: '30Shine - 82 Trần Não', province: 'Hồ Chí Minh', address: '82 Trần Não, Quận 2, TP. HCM', features: ['Đậu ô tô'], image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=400&q=80' },
];

const SelectSalon = () => {
  const [cityFilter, setCityFilter] = useState('all');

  const { step, setStep, setSelectedSalon } = useBooking();

  const filteredSalons = cityFilter === 'all' ? MOCK_SALONS : MOCK_SALONS.filter(s => s.city === cityFilter);

  const navigate = useNavigate();

  return (
    <div className={`mx-auto w-full p-4 mt-4 ${step === 4 || step === 5 ? 'max-w-[1000px]' : 'max-w-[800px]'}`}>

      {/* STEP 1: CHỌN SALON */}
      <div className="animate-fade-in">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#1b2a4a]">Chọn Salon</h2>
        <Input prefix={<Search className="text-gray-400" />} placeholder="Tìm kiếm salon..." size="large" className="mb-4 rounded-xl" />

        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-2 border-b">
          {[{ id: 'all', name: 'Tất cả' }, { id: 'hn', name: 'Hà Nội' }, { id: 'hcm', name: 'Hồ Chí Minh' }, { id: 'dn', name: 'Đà Nẵng' }].map(city => (
            <div key={city.id} onClick={() => setCityFilter(city.id)}
              className={`px-4 py-2 border rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition-colors select-none
                     ${cityFilter === city.id ? 'bg-[#1b2a4a] text-white border-[#1b2a4a]' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}>
              {city.name}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {filteredSalons.map(salon => (
            <div key={salon.id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group">
              <div className="w-full sm:w-40 h-40 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                <img src={salon.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="salon" />
              </div>
              <div className="flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 text-lg mb-1">{salon.name}</h3>
                <p className="text-sm text-gray-500 mb-2 flex items-start gap-1"><MapPin className="w-4 h-4 shrink-0 mt-0.5 text-red-500" /> {salon.address}</p>
                <div className="flex gap-2 mb-4">
                  {salon.features.map((f, i) => <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{f}</span>)}
                </div>
                <div className="mt-auto">
                  <button onClick={() => { setSelectedSalon(salon); setStep(2); navigate('/booking/select-stylist-and-date'); }} className="w-full sm:w-auto bg-[#1b2a4a] hover:bg-[#244383] text-white px-8 py-2.5 rounded-lg font-bold text-sm uppercase transition-colors shadow-sm">
                    CHỌN SALON NÀY
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SelectSalon;