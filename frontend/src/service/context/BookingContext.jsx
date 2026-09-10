import { createContext, useContext, useState } from "react";

const BookingContext = createContext();

export function BookingProvider({ children }) {
  const [step, setStep] = useState(1);
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [selectedStylist, setSelectedStylist] = useState(null);
  const [selectedDate, setSelectedDate] = useState('tomorrow');
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);

  return (
    <BookingContext.Provider value={{
      step, setStep,
      selectedSalon, setSelectedSalon,
      selectedTime, setSelectedTime,
      selectedDate, setSelectedDate,
      timeSlots, setTimeSlots,
      selectedServices, setSelectedServices,
      selectedStylist, setSelectedStylist,
    }}>
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