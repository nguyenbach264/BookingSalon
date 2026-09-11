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
import ProtectedRoute from "./ProtectedRoute";
import OAuth2CallbackPage from "../Auth/OAuth2CallbackPage";

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />}>
          <Route index element={<HomeContent />} />
          <Route path="/service" element={<ServicePage />} />
          <Route path="/notification_detail" element={<NotificationDetailPage />} />
          <Route
            path="/booking"
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            }
          >
            <Route path="select-salon" element={<SelectSalon />} />
            <Route path="select-stylist-and-date" element={<SelectStylistAndDate />} />
            <Route path="select-service" element={<SelectService />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="checkout-successfully" element={<CheckoutSuccessfully />} />
          </Route>
        </Route>

        <Route path="/shop" element={<ShopPage />} />

        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />

        {/* OAuth2 / Google Callback redirect */}
        <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />

        <Route
          path="/unauthorized"
          element={
            <div className="flex flex-col items-center justify-center h-screen text-center">
              <h1 className="text-5xl font-black text-[#1b2a4a] mb-4">403</h1>
              <p className="text-gray-500 text-lg">Bạn không có quyền truy cập trang này.</p>
            </div>
          }
        />
      </Routes>
    </>
  );
}

export default AppRoutes;