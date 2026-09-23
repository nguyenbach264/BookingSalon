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
import StylistDashboard from "../StylistPage/StylistDashboard";
import AdminDashboard from "../AdminPage/AdminDashboard";
import LoginPage from "../ShopPage/LoginPage";
import RegisterPage from "../ShopPage/RegisterPage";
import UserProfilePage from "../UserPage/UserProfilePage";
import MyBookingsPage from "../UserPage/MyBookingsPage";
import MyOrdersPage from "../UserPage/MyOrdersPage";
import { useAuth } from "../../auth/authProvider";

function AppRoutes() {
  const {
    loginModalVisible,
    registerModalVisible,
    authNotice,
    targetRedirect,
    closeLoginModal,
    closeRegisterModal,
    openRegisterModal,
    openLoginModal,
  } = useAuth();

  return (
    <>
      <LoginPage
        visible={loginModalVisible}
        onClose={closeLoginModal}
        onGoToRegister={openRegisterModal}
        notice={authNotice}
        targetRedirect={targetRedirect}
      />
      <RegisterPage
        visible={registerModalVisible}
        onClose={closeRegisterModal}
        onLogin={() => openLoginModal()}
      />

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
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <MyBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute>
                <MyOrdersPage />
              </ProtectedRoute>
            }
          />
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

        {/* ── STYLIST ROUTES ─────────────────────────────────── */}
        <Route
          path="/stylist/*"
          element={
            <ProtectedRoute roles={["STYLIST"]}>
              <Routes>
                <Route path="dashboard" element={<StylistDashboard />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* ── ADMIN ROUTES ───────────────────────────────────── */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
              </Routes>
            </ProtectedRoute>
          }
        />

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