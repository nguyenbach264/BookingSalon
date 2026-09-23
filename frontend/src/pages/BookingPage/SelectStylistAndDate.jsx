import React, { useState, useEffect, useMemo } from 'react';
import { Spin, Tag, Tooltip } from 'antd';
import {
  User,
  MapPin,
  Calendar,
  Clock,
  Star,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check,
  Scissors,
  Award,
} from 'lucide-react';
import { useBooking } from '../../service/context/BookingContext';
import { getStylistsBySalon, getAllStylists, getStylistBookedSlots } from '../../service/api/bookingApi';

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
];

export function SelectStylistAndDate() {
  const {
    setStep,
    selectedSalon,
    selectedStylist,
    setSelectedStylist,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
  } = useBooking();

  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Fetch stylists from backend for the selected salon
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchPromise = selectedSalon?.id
      ? getStylistsBySalon(selectedSalon.id).then((res) => {
          if (Array.isArray(res) && res.length > 0) return res;
          return getAllStylists(); // Fallback to all stylists if salon list is empty
        })
      : getAllStylists();

    fetchPromise
      .then((data) => {
        if (isMounted) {
          const list = Array.isArray(data) ? data : [];
          setStylists(list);
          // If no stylist is selected yet, or if current selection is invalid, preselect first stylist
          if (list.length > 0 && !selectedStylist) {
            setSelectedStylist(list[0]);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching stylists:', err);
        if (isMounted) {
          setError('Không thể tải danh sách Stylist. Vui lòng thử lại!');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSalon?.id]);

  // Fetch booked slots for the selected stylist on the selected date
  useEffect(() => {
    if (!selectedStylist?.id || !selectedDate) {
      setBookedSlots([]);
      return;
    }
    let isMounted = true;
    setLoadingSlots(true);
    getStylistBookedSlots(selectedStylist.id, selectedDate)
      .then((slots) => {
        if (isMounted) {
          const list = Array.isArray(slots) ? slots : [];
          setBookedSlots(list);
          // If selectedTime is in booked slots, clear it
          if (selectedTime && list.includes(selectedTime)) {
            setSelectedTime(null);
          }
          setLoadingSlots(false);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch stylist booked slots:', err);
        if (isMounted) setLoadingSlots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedStylist?.id, selectedDate]);

  // Generate next 7 days for the date picker
  const next7Days = useMemo(() => {
    const days = [];
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const isoStr = d.toISOString().split('T')[0];
      const dayOfWeek = dayNames[d.getDay()];
      const dayNum = d.getDate();
      const monthNum = d.getMonth() + 1;
      const label = i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : `${dayOfWeek}`;
      const subLabel = `${dayNum}/${monthNum}`;
      days.push({ iso: isoStr, label, subLabel, isToday: i === 0 });
    }
    return days;
  }, []);

  // Generate 30-min time slots between 08:30 and 20:30
  const timeSlots = useMemo(() => {
    const slots = [];
    const now = new Date();
    const isSelectedDayToday = selectedDate === now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    for (let hour = 8; hour <= 20; hour++) {
      for (const min of [0, 30]) {
        if (hour === 8 && min === 0) continue; // Start 08:30
        if (hour === 20 && min === 30) continue; // End 20:00

        const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        let available = true;
        const isBooked = bookedSlots.includes(timeStr);

        if (isBooked) {
          available = false;
        } else if (isSelectedDayToday) {
          // Slot must be at least 15 minutes after current time
          if (hour < currentHour || (hour === currentHour && min <= currentMin + 15)) {
            available = false;
          }
        }

        slots.push({ time: timeStr, available, isBooked });
      }
    }
    return slots;
  }, [selectedDate, bookedSlots]);

  const getStylistAvatar = (st, idx) => {
    return st.avatarUrl || DEFAULT_AVATARS[idx % DEFAULT_AVATARS.length];
  };

  const handleNext = () => {
    if (selectedStylist && selectedTime) {
      setStep(3);
    }
  };

  return (
    <div className="max-w-[960px] mx-auto px-4 py-6 animate-fade-in">
      {/* Top Banner: Selected Salon Summary */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Chi nhánh đã chọn
            </p>
            <h3 className="font-extrabold text-gray-900 text-base sm:text-lg">
              {selectedSalon?.salonName || selectedSalon?.name || 'Chưa chọn salon'}
            </h3>
            <p className="text-xs text-gray-500 truncate max-w-md">
              {selectedSalon?.address || 'Vui lòng chọn salon'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setStep(1)}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-blue-200 shrink-0"
        >
          Đổi salon khác
        </button>
      </div>

      {/* SECTION 1: SELECT STYLIST */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
              1
            </div>
            <h2 className="font-extrabold text-lg text-[#1b2a4a]">Chọn Stylist tạo kiểu</h2>
          </div>
          <span className="text-xs text-gray-400">
            {stylists.length} Stylist sẵn sàng phục vụ
          </span>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <Spin />
            <p className="text-xs text-gray-400 mt-2">Đang tải danh sách stylist...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm text-center">
            {error}
          </div>
        ) : stylists.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            Hiện chưa có stylist nào thuộc chi nhánh này.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {stylists.map((stylist, idx) => {
              const isSelected = selectedStylist?.id === stylist.id;
              const avatar = getStylistAvatar(stylist, idx);
              const rank = stylist.levelRank || 'Stylist';
              const rating = stylist.ratingAverage || '4.9';

              return (
                <div
                  key={stylist.id || idx}
                  onClick={() => setSelectedStylist(stylist)}
                  className={`group relative rounded-xl border-2 p-3 flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-100 shadow-md transform -translate-y-0.5'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50/70'
                  }`}
                >
                  {/* Selected check badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-sm">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  {/* Avatar */}
                  <div
                    className={`w-20 h-20 rounded-full overflow-hidden border-2 mb-2 relative ${
                      isSelected ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={avatar}
                      alt={stylist.fullName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Name & Rank */}
                  <h4 className="font-bold text-gray-900 text-sm mb-0.5 truncate w-full">
                    {stylist.fullName || stylist.nickname || 'Stylist'}
                  </h4>

                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mb-1.5">
                    {rank}
                  </span>

                  {/* Rating & stats */}
                  <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{rating}</span>
                    <span className="text-gray-400 font-normal text-[10px]">
                      ({stylist.totalServedBookings || 120}+ lượt)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: SELECT DATE & TIME */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-sm mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
            2
          </div>
          <h2 className="font-extrabold text-lg text-[#1b2a4a]">Chọn ngày & giờ hẹn</h2>
        </div>

        {/* 7-Day Date Carousel */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">
            Chọn ngày hẹn
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {next7Days.map((d) => {
              const isSelected = selectedDate === d.iso;
              return (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => {
                    setSelectedDate(d.iso);
                  }}
                  className={`py-2.5 px-2 rounded-xl flex flex-col items-center justify-center transition-all duration-200 border-2 ${
                    isSelected
                      ? 'bg-[#1b2a4a] text-white border-[#1b2a4a] shadow-md transform scale-[1.02]'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-white'
                  }`}
                >
                  <span
                    className={`text-[11px] font-bold ${
                      isSelected ? 'text-blue-300' : 'text-gray-500'
                    }`}
                  >
                    {d.label}
                  </span>
                  <span className="text-sm sm:text-base font-black mt-0.5">{d.subLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slots Grid */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Khung giờ trống ({timeSlots.filter((s) => s.available).length} khung giờ)
            </p>
            {selectedTime && (
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                Đã chọn: {selectedTime}
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {timeSlots.map((slot, i) => {
              const isSelected = selectedTime === slot.time;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => setSelectedTime(slot.time)}
                  title={slot.isBooked ? 'Stylist đã có lịch hẹn khung giờ này' : !slot.available ? 'Đã qua khung giờ này' : slot.time}
                  className={`py-2 px-1 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex flex-col items-center justify-center gap-0.5 ${
                    slot.isBooked
                      ? 'bg-rose-50 text-rose-400 border border-rose-200 cursor-not-allowed opacity-80'
                      : !slot.available
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed border border-gray-100'
                      : isSelected
                      ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-200 scale-105'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50'
                  }`}
                >
                  <span className={slot.isBooked ? 'line-through' : ''}>{slot.time}</span>
                  {slot.isBooked && (
                    <span className="text-[9px] text-rose-500 font-bold leading-tight">Đã bận</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-blue-600 inline-block"></span>
              <span>Đang chọn</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-white border border-gray-300 inline-block"></span>
              <span>Còn trống</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-rose-50 border border-rose-200 inline-block"></span>
              <span className="text-rose-600 font-medium">Stylist đã bận</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-gray-100 border border-gray-200 inline-block"></span>
              <span>Đã qua giờ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Quay lại chọn Salon
        </button>

        <button
          type="button"
          disabled={!selectedStylist || !selectedTime}
          onClick={handleNext}
          className={`px-8 py-3 rounded-xl text-white font-bold text-sm shadow-md flex items-center gap-2 transition-all ${
            selectedStylist && selectedTime
              ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg cursor-pointer transform hover:scale-[1.02]'
              : 'bg-gray-300 cursor-not-allowed text-gray-500'
          }`}
        >
          Tiếp tục chọn Dịch vụ
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}