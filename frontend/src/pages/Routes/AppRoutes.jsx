import { Route, Routes } from "react-router-dom";
import ShopPage from "../ShopPage/main";
import CheckoutPage from "../CheckoutPage/main";
import HomePage from "../HomePage/main";
import ServicePage from "../ServicePage/main";
import HomeContent from "../HomePage/HomeContent";
import NotificationDetailPage from "../components/NotificationDetailPage";
import BookingPage from "../BookingPage/index";
import SelectSalon from "../BookingPage/SelectSalon";
import { SelectStylistAndDate } from "../BookingPage/SelectStylistAndDate";
import { SelectService } from "../BookingPage/SelectService";
import { Checkout } from "../BookingPage/Checkout";
import { CheckoutSuccessfully } from "../BookingPage/CheckoutSuccessfully";


function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />}>
          <Route index element={<HomeContent />} /> 
          <Route path="/service" element={<ServicePage />} />
          <Route path="/notification_detail" element={<NotificationDetailPage />} />
          <Route path="/booking" element={<BookingPage />}>
            <Route path="select-salon" element={<SelectSalon />} />
            <Route path="select-stylist-and-date" element={<SelectStylistAndDate />} />
            <Route path="select-service" element={<SelectService />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="checkout-successfully" element={<CheckoutSuccessfully />} />
          </Route>
        </Route>
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
      </Routes>
    </>
  );
}

export default AppRoutes;