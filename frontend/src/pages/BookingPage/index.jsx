import React, { useState, useEffect } from 'react';
import { Input, Select, } from 'antd';
import { Search, X, User, Trash2, CalendarCheck, MapPin, Check, ArrowLeft, ChevronUp, ChevronDown, Calendar } from 'lucide-react';
import SelectSalon from './SelectSalon';
import { SelectStylistAndDate } from './SelectStylistAndDate';
import { useBooking } from '../../service/context/BookingContext';
import { SelectService } from './SelectService';
import { Checkout } from './Checkout';
import { CheckoutSuccessfully } from './CheckoutSuccessfully';

const BookingPage = ({ onGoBack }) => {
  const { step, setStep, selectedStylist, selectedDate, setTimeSlots, setSelectedTime } = useBooking();

  // Dynamic Time Validation
  useEffect(() => {
    const baseSlots = ['8h00', '8h30', '9h00', '9h30', '10h00', '10h30', '11h00', '11h30', '13h00', '13h30', '14h00', '14h30', '15h00', '15h30', '16h00', '16h30', '17h00', '17h30', '18h00', '18h30', '19h00', '19h30'];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const slots = baseSlots.map(timeStr => {
      const [h, m] = timeStr.replace('h', ':').split(':').map(Number);
      let available = true;

      // Disable past times if "Today" is selected
      if (selectedDate === 'today') {
        if (h < currentHour || (h === currentHour && m <= currentMinute)) {
          available = false;
        }
      }

      // Randomly mock some booked slots for realism
      if (Math.random() < 0.2) available = false;

      return { time: timeStr, available };
    });
    setTimeSlots(slots);
    setSelectedTime(null);
  }, [selectedDate, selectedStylist]);

  useEffect(() => {
    console.log('Current Step:', step);
  }, [step]);

  const stepsTitle = ['Salon', 'Stylist và Thời gian', 'Dịch vụ', 'Thanh toán'];

  return (
    <div className="w-full flex-1 bg-gray-50 flex flex-col relative pb-32">
      {/* Horizontal Progress Bar */}
      {step < 5 && (
        <div className="w-full bg-white shadow-sm sticky top-0 z-20 border-b py-4">
          <div className="max-w-[800px] mx-auto px-4 relative flex items-center justify-between mb-5">
            <button onClick={onGoBack} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors p-2 hidden sm:block">
              <ArrowLeft className="w-6 h-6" />
            </button>

            <div className="w-full sm:w-4/5 mx-auto relative flex items-center justify-between px-4 sm:px-10">
              {/* Background Line */}
              <div className="absolute top-1/2 left-[10%] right-[10%] h-1 bg-gray-100 -z-10 -translate-y-1/2 rounded-full"></div>
              {/* Progress Line */}
              <div className="absolute top-1/2 left-[10%] h-1 bg-[#1b2a4a] -z-10 -translate-y-1/2 transition-all duration-500 rounded-full"
                style={{ width: `${((step - 1) / 3) * 80}%` }}></div>

              {stepsTitle.map((title, index) => {
                const stepNumber = index + 1;
                const isActive = step === stepNumber;
                const isCompleted = step > stepNumber;
                return (
                  <div
                    key={title}
                    className="flex flex-col items-center gap-1.5 relative z-10"
                    onClick={() => { if (stepNumber < step) setStep(stepNumber); }}
                    style={{ cursor: stepNumber < step ? 'pointer' : 'default' }}
                  >
                    <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                      ${isCompleted ? 'bg-[#1b2a4a] text-white ring-2 ring-offset-2 ring-[#1b2a4a]' :
                        isActive ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                          'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                    >
                      {isCompleted ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : stepNumber}
                    </div>
                    <span className={`text-[10px] sm:text-xs font-semibold absolute -bottom-5 whitespace-nowrap 
                      ${isActive || isCompleted ? 'text-[#1b2a4a]' : 'text-gray-400'}`}>
                      {title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <div>
        {step === 1 && <SelectSalon />}
        {step === 2 && <SelectStylistAndDate />}
        {step === 3 && <SelectService />}
        {step === 4 && <Checkout />}
        {step === 5 && <CheckoutSuccessfully onGoBack={onGoBack} />}
      </div>
    </div>
  );
}

export default BookingPage; 