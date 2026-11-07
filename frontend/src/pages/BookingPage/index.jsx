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
    <div className="w-full flex-1 bg-[#f8fafc] min-h-screen flex flex-col relative pb-32">

      {/* ── Stepper Progress Bar ──────────────────────────── */}
      {step < 5 && (
        <div className="w-full bg-white shadow-sm sticky top-0 z-20 border-b border-gray-200/80 backdrop-blur-md bg-white/97">
          <div className="max-w-[900px] mx-auto px-4 py-4 relative flex items-center">
            {/* Back button */}
            <button
              onClick={handleBackNavigation}
              className="absolute left-4 text-gray-500 hover:text-[#60a5fa] transition-colors p-2 rounded-xl hover:bg-blue-50"
              title="Quay lại"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Steps */}
            <div className="w-full flex items-center justify-center px-12">
              <div className="relative flex items-center justify-between w-full max-w-[560px]">
                {/* Background line */}
                <div className="absolute top-[18px] sm:top-[20px] left-[calc(12.5%)] right-[calc(12.5%)] h-0.5 bg-gray-200 -z-10" />
                {/* Progress line */}
                <div
                  className="absolute top-[18px] sm:top-[20px] left-[calc(12.5%)] h-0.5 bg-[#60a5fa] -z-10 transition-all duration-500"
                  style={{ width: `${((step - 1) / 3) * 75}%` }}
                />

                {stepsTitle.map((title, index) => {
                  const stepNumber = index + 1;
                  const isActive = step === stepNumber;
                  const isCompleted = step > stepNumber;
                  const canClick = canNavigateTo(stepNumber);

                  return (
                    <div
                      key={title}
                      className="flex flex-col items-center gap-2 relative z-10 select-none"
                      onClick={() => { if (canClick) setStep(stepNumber); }}
                      style={{ cursor: canClick ? 'pointer' : 'not-allowed' }}
                    >
                      <div
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 ${
                          isCompleted
                            ? 'bg-[#60a5fa] text-white shadow-xs'
                            : isActive
                            ? 'bg-[#60a5fa] text-white ring-4 ring-blue-100 shadow-sm'
                            : canClick
                            ? 'bg-white text-gray-600 border border-gray-300 hover:border-[#60a5fa]'
                            : 'bg-gray-100 text-gray-400 border border-gray-200'
                        }`}
                      >
                        {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : stepNumber}
                      </div>
                      <span
                        className={`text-[10px] sm:text-xs font-semibold whitespace-nowrap transition-colors ${
                          isActive
                            ? 'text-[#60a5fa] font-bold'
                            : isCompleted
                            ? 'text-gray-800 font-medium'
                            : canClick
                            ? 'text-gray-500 hover:text-[#60a5fa]'
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