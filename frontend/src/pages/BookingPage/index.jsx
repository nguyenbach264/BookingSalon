import React from 'react';
import { Check, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SelectSalon from './SelectSalon';
import { SelectStylistAndDate } from './SelectStylistAndDate';
import { useBooking } from '../../service/context/BookingContext';
import { SelectService } from './SelectService';
import { Checkout } from './Checkout';
import { CheckoutSuccessfully } from './CheckoutSuccessfully';

const BookingPage = ({ onGoBack }) => {
  const { step, setStep, canNavigateTo } = useBooking();
  const navigate = useNavigate();

  const handleBackNavigation = () => {
    if (onGoBack) {
      onGoBack();
    } else if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/');
    }
  };

  const stepsTitle = ['Chọn Salon', 'Stylist & Thời gian', 'Chọn dịch vụ', 'Xác nhận & Thanh toán'];
  const mobileStepsTitle = ['Salon', 'Thời gian', 'Dịch vụ', 'Xác nhận'];

  return (
    <div className="w-full flex-1 bg-gradient-to-b from-slate-50 to-gray-100 min-h-screen flex flex-col relative pb-32">
      {/* Horizontal Stepper Progress Bar */}
      {step < 5 && (
        <div className="w-full bg-white shadow-sm sticky top-0 z-20 border-b border-gray-200/80 backdrop-blur-md bg-white/95 py-4">
          <div className="max-w-[860px] mx-auto px-4 relative flex items-center justify-between mb-5">
            <button
              onClick={handleBackNavigation}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
              title="Quay lại"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="w-full sm:w-4/5 mx-auto relative flex items-center justify-between px-2 sm:px-10">
              {/* Background Line */}
              <div className="absolute top-1/2 left-[10%] right-[10%] h-1 bg-gray-200 -z-10 -translate-y-1/2 rounded-full"></div>
              {/* Progress Line */}
              <div
                className="absolute top-1/2 left-[10%] h-1 bg-blue-600 -z-10 -translate-y-1/2 transition-all duration-500 rounded-full"
                style={{ width: `${((step - 1) / 3) * 80}%` }}
              ></div>

              {stepsTitle.map((title, index) => {
                const stepNumber = index + 1;
                const isActive = step === stepNumber;
                const isCompleted = step > stepNumber;
                const canClick = canNavigateTo(stepNumber);

                return (
                  <div
                    key={title}
                    className="flex flex-col items-center gap-1.5 relative z-10 select-none group"
                    onClick={() => {
                      if (canClick) setStep(stepNumber);
                    }}
                    style={{ cursor: canClick ? 'pointer' : 'not-allowed' }}
                  >
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 shadow-sm
                      ${
                        isCompleted
                          ? 'bg-blue-600 text-white ring-2 ring-offset-2 ring-blue-600 hover:bg-blue-700'
                          : isActive
                          ? 'bg-[#1b2a4a] text-white ring-4 ring-blue-100 scale-110 shadow-md'
                          : canClick
                          ? 'bg-white text-gray-700 border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50'
                          : 'bg-gray-100 text-gray-400 border border-gray-200'
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" /> : stepNumber}
                    </div>
                    <span
                      className={`text-[9px] sm:text-xs font-semibold absolute -bottom-5 whitespace-nowrap transition-colors ${
                        isActive
                          ? 'text-[#1b2a4a] font-bold'
                          : isCompleted
                          ? 'text-blue-600'
                          : canClick
                          ? 'text-gray-600 group-hover:text-blue-600'
                          : 'text-gray-400'
                      }`}
                    >
                      <span className="hidden sm:inline">{title}</span>
                      <span className="inline sm:hidden">{mobileStepsTitle[index]}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step Content */}
      <main className="w-full flex-1">
        {step === 1 && <SelectSalon />}
        {step === 2 && <SelectStylistAndDate />}
        {step === 3 && <SelectService />}
        {step === 4 && <Checkout />}
        {step === 5 && <CheckoutSuccessfully onGoBack={() => navigate('/')} />}
      </main>
    </div>
  );
};

export default BookingPage;