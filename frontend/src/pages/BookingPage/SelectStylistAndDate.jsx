import {User, MapPin, Calendar } from 'lucide-react';
import { useBooking } from '../../service/context/BookingContext';
import { useNavigate } from 'react-router';

const MOCK_STYLISTS = [
  { id: 1, name: 'Hiển Nguyễn', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=200&fit=crop' },
  { id: 2, name: 'Tiến Trần', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=200&fit=crop' },
  { id: 3, name: 'Hiếu Nguyễn', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=200&fit=crop' },
];

export function SelectStylistAndDate() {
  const { setStep, selectedSalon, selectedStylist, setSelectedStylist, selectedDate, setSelectedDate, timeSlots, selectedTime, setSelectedTime } = useBooking();
  
  const navigate = useNavigate();

  return (
    <div className="animate-in fade-in duration-300 mt-8">
      <div className="mb-6 pb-4 border-b flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500 mb-1">Salon đã chọn:</p>
          <p className="font-bold text-[#1b2a4a] flex items-center gap-1"><MapPin className="w-4 h-4 text-blue-600" /> {selectedSalon.name}</p>
        </div>
        <button onClick={() => setStep(1)} className="text-blue-600 text-sm font-medium hover:underline">Thay đổi</button>
      </div>

      <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><User className="text-blue-600" /> 1. Chọn Stylist</h3>
      <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar snap-x">
        {MOCK_STYLISTS.map(stylist => {
          const isSelected = selectedStylist?.id === stylist.id;
          return (
            <div key={stylist.id} onClick={() => setSelectedStylist(stylist)} className={`snap-center shrink-0 w-28 flex flex-col items-center gap-2 cursor-pointer transition-all ${isSelected ? 'scale-105' : 'opacity-70 hover:opacity-100'}`}>
              <div className={`mt-2 w-20 h-24 rounded-md overflow-hidden border-2 select-none ${isSelected ? 'border-blue-600 shadow-md' : 'border-transparent'}`}>
                <img src={stylist.image} className="w-full h-full object-cover pointer-events-none" draggable={false} alt="stylist" />
              </div>
              <p className={`text-xs text-center px-1 ${isSelected ? 'font-bold text-blue-700' : 'font-medium text-gray-600'}`}>{stylist.name}</p>
            </div>
          )
        })}
      </div>

      <h3 className="font-bold text-lg mt-6 mb-4 flex items-center gap-2"><Calendar className="text-blue-600" /> 2. Chọn ngày & giờ</h3>
      <select className="w-full sm:w-64 p-3 border rounded-xl bg-gray-50 font-medium mb-4 outline-none focus:border-blue-500" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
        <option value="today">Hôm nay ({new Date().toLocaleDateString('vi-VN')})</option>
        <option value="tomorrow">Ngày mai</option>
        <option value="next">Ngày kia</option>
      </select>

      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3">
        {timeSlots.map((slot, i) => {
          const isSelected = selectedTime === slot.time;
          return (
            <button key={i} disabled={!slot.available} onClick={() => setSelectedTime(slot.time)}
              className={`py-2 rounded-lg text-sm font-medium transition-all ${!slot.available ? 'bg-gray-100 text-gray-300 cursor-not-allowed line-through' : isSelected ? 'bg-blue-600 text-white shadow-md' : 'bg-white border hover:border-blue-400 hover:text-blue-600'}`}>
              {slot.time}
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <button disabled={!selectedTime} onClick={() => { setStep(3); navigate('/booking/select-service'); }} className="w-full sm:w-auto px-10 py-3 bg-[#1b2a4a] text-white font-bold rounded-xl disabled:opacity-50 transition-colors">
          TIẾP TỤC
        </button>
      </div>
    </div>
  );
}