import { Route, Routes, Navigate } from "react-router-dom";
import ShopPage from "../pages/ShopPage";
import ProductDetailPage from '../pages/ShopPage/ProductDetailPage';
import CheckoutPage from "../pages/CheckoutPage";
import HomePage from "../pages/HomePage";
import ServicePage from "../pages/ServicePage";
import HomeContent from "../pages/HomePage/HomeContent";
import SalonsPage from "../pages/SalonsPage";
import PromotionsPage from "../pages/PromotionsPage";
import AboutUsPage from "../pages/AboutUsPage";
import NotificationDetailPage from "../components/NotificationDetailPage";
import BookingPage from "../pages/BookingPage";
import SelectSalon from "../pages/BookingPage/SelectSalon";
import { SelectStylistAndDate } from "../pages/BookingPage/SelectStylistAndDate";
import { SelectService } from "../pages/BookingPage/SelectService";
import { Checkout } from "../pages/BookingPage/Checkout";
import { CheckoutSuccessfully } from "../pages/BookingPage/CheckoutSuccessfully";
import ProtectedRoute from "./ProtectedRoute";
import OAuth2CallbackPage from "../pages/Auth/OAuth2CallbackPage";
import StylistDashboard from "../pages/StylistPage/StylistDashboard";
import AdminDashboard from "../pages/AdminPage/AdminDashboard";
import SalonDetailPage from "../pages/AdminPage/views/SalonDetailPage";
import LoginPage from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import UserProfilePage from "../pages/UserPage/UserProfilePage";
import MyBookingsPage from "../pages/UserPage/MyBookingsPage";
import MyOrdersPage from "../pages/UserPage/MyOrdersPage";
import PaymentResultPage from "../pages/PaymentPage/PaymentResultPage";
import VnPaySandboxSimulatorPage from "../pages/PaymentPage/VnPaySandboxSimulatorPage";
import ErrorPage from "../pages/ErrorPage";
import { useAuth } from "../auth/AuthProvider";

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
          <Route path="/salons" element={<SalonsPage />} />
          <Route path="/promotions" element={<PromotionsPage />} />
          <Route path="/about" element={<AboutUsPage />} />
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
        <Route path="/shop/product/:id" element={<ProductDetailPage />} />

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

        {/* VNPay Payment Result page — public, no auth required */}
        <Route path="/payment/result" element={<PaymentResultPage />} />

        {/* VNPay Sandbox Simulator gateway — public simulator page */}
        <Route path="/payment/vnpay-sandbox-simulator" element={<VnPaySandboxSimulatorPage />} />

        {/* ── STYLIST ROUTES ─────────────────────────────────── */}
        <Route
          path="/stylist/*"
          element={
            <ProtectedRoute roles={["STYLIST"]}>
              <Routes>
                <Route path="" element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<StylistDashboard />} />
                <Route path="dashboard/:tab" element={<StylistDashboard />} />
                <Route path="*" element={<ErrorPage customError={{ status: 404, message: 'Đường dẫn stylist không tồn tại.' }} />} />
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
                <Route path="" element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="dashboard/:tab" element={<AdminDashboard />} />
                <Route path="salons/:salonId" element={<SalonDetailPage />} />
                <Route path="salon/:salonId" element={<SalonDetailPage />} />
                <Route path="*" element={<ErrorPage customError={{ status: 404, message: 'Đường dẫn trong trang quản trị không tồn tại.' }} />} />
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

        {/* Dedicated Error route */}
        <Route path="/error" element={<ErrorPage />} />

        {/* 404 / Catch-all route */}
        <Route path="*" element={<ErrorPage customError={{ status: 404, message: 'Đường dẫn bạn yêu cầu không tồn tại.' }} />} />
      </Routes>
    </>
  );
}

export default AppRoutes;