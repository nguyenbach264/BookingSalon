import { createContext, useContext, useState, useCallback } from "react";

const BookingContext = createContext();

export function BookingProvider({ children }) {
  const [step, setStepState] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);

  // Booking details state
  const [selectedSalon, setSelectedSalonState] = useState(null);
  const [selectedStylist, setSelectedStylist] = useState(null);
  
  // Format today's date YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [customerNotes, setCustomerNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH"); // 'CASH' | 'BANK_TRANSFER'
  const [createdBooking, setCreatedBooking] = useState(null);

  // Custom setSelectedSalon that only clears dependent selections if the salon changed
  const setSelectedSalon = useCallback((salon) => {
    setSelectedSalonState((prev) => {
      if (prev?.id !== salon?.id) {
        // If salon actually changed, clear stylist and time, and reset maxStepReached
        setSelectedStylist(null);
        setSelectedTime(null);
        setMaxStepReached(1);
      }
      return salon;
    });
  }, []);

  const setStep = useCallback((newStep) => {
    setStepState(newStep);
    setMaxStepReached((prev) => Math.max(prev, newStep));
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, []);

  // Check if step s is accessible: ONLY allow steps <= maxStepReached
  const canNavigateTo = useCallback((targetStep) => {
    if (targetStep > maxStepReached) return false;
    if (targetStep === 1) return true;
    if (targetStep === 2) return !!selectedSalon;
    if (targetStep === 3) return !!selectedSalon && !!selectedStylist && !!selectedTime;
    if (targetStep === 4) return !!selectedSalon && !!selectedStylist && !!selectedTime && selectedServices.length > 0;
    if (targetStep === 5) return !!createdBooking;
    return false;
  }, [maxStepReached, selectedSalon, selectedStylist, selectedTime, selectedServices, createdBooking]);

  const goToStep = useCallback((targetStep) => {
    if (canNavigateTo(targetStep)) {
      setStep(targetStep);
      return true;
    }
    return false;
  }, [canNavigateTo, setStep]);

  const resetBooking = useCallback(() => {
    setStepState(1);
    setMaxStepReached(1);
    setSelectedSalonState(null);
    setSelectedStylist(null);
    setSelectedDate(getTodayStr());
    setSelectedTime(null);
    setSelectedServices([]);
    setCustomerNotes("");
    setPaymentMethod("CASH");
    setCreatedBooking(null);
  }, []);

  return (
    <BookingContext.Provider
      value={{
        step,
        setStep,
        maxStepReached,
        canNavigateTo,
        goToStep,
        selectedSalon,
        setSelectedSalon,
        selectedStylist,
        setSelectedStylist,
        selectedDate,
        setSelectedDate,
        timeSlots,
        setTimeSlots,
        selectedTime,
        setSelectedTime,
        selectedServices,
        setSelectedServices,
        customerNotes,
        setCustomerNotes,
        paymentMethod,
        setPaymentMethod,
        createdBooking,
        setCreatedBooking,
        resetBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
};