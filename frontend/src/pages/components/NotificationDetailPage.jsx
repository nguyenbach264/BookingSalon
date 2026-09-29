import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Breadcrumb, Spin, Tag, Button } from "antd";
import {
  ChevronLeft,
  Bell,
  CalendarCheck,
  Scissors,
  PackageCheck,
  AlertTriangle,
  Sparkles,
  ShoppingBag,
  MapPin,
  Phone,
  User,
  CreditCard,
  ExternalLink,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useNotification } from "../../service/context/NotificationContext";
import { getNotificationById } from "../../service/api/notificationApi";

const NotificationDetailPage = ({ onGoBack }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const notificationId = searchParams.get("id");
  const { selectedNotification, setSelectedNotification, fetchSingleNotification } = useNotification();

  const [notification, setNotification] = useState(selectedNotification || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (notificationId) {
      setLoading(true);
      // Gọi fetchSingleNotification để đồng thời lấy từ DB và đồng bộ unreadCount trong Context
      const fetchDetail = async () => {
        try {
          let data = null;
          if (fetchSingleNotification) {
            data = await fetchSingleNotification(notificationId);
          }
          if (!data) {
            data = await getNotificationById(notificationId);
          }
          if (data) {
            setNotification(data);
            if (setSelectedNotification) setSelectedNotification(data);
          } else {
            setError("Không tìm thấy thông báo.");
          }
        } catch (err) {
          console.error("Lỗi tải thông báo chi tiết:", err);
          setError("Không thể tải thông tin thông báo từ hệ thống.");
        } finally {
          setLoading(false);
        }
      };

      fetchDetail();
    } else if (selectedNotification) {
      setNotification(selectedNotification);
    }
  }, [notificationId, fetchSingleNotification, setSelectedNotification]);

  const handleBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      navigate(-1);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "BOOKING_CREATED":
      case "service":
        return <CalendarCheck className="w-6 h-6 text-emerald-600" />;
      case "BOOKING_CONFIRMED":
        return <Scissors className="w-6 h-6 text-blue-600" />;
      case "BOOKING_CANCELLED":
        return <AlertTriangle className="w-6 h-6 text-rose-600" />;
      case "ORDER_DELIVERED":
      case "ORDER_CREATED":
      case "ORDER_CONFIRMED":
      case "order":
        return <PackageCheck className="w-6 h-6 text-purple-600" />;
      case "REVIEW_REQUEST":
      case "BOOKING_COMPLETED":
      case "promo":
        return <Sparkles className="w-6 h-6 text-amber-500" />;
      default:
        return <Bell className="w-6 h-6 text-blue-600" />;
    }
  };

  const getOrderStatusTag = (status) => {
    switch (status) {
      case "DELIVERED":
        return <Tag color="green" className="font-bold">Đã giao hàng</Tag>;
      case "SHIPPING":
        return <Tag color="blue" className="font-bold">Đang giao hàng</Tag>;
      case "CONFIRMED":
        return <Tag color="cyan" className="font-bold">Đã xác nhận</Tag>;
      case "CANCELLED":
        return <Tag color="red" className="font-bold">Đã hủy</Tag>;
      default:
        return <Tag color="orange" className="font-bold">Chờ xử lý</Tag>;
    }
  };

  const getPaymentStatusTag = (status) => {
    switch (status) {
      case "PAID":
        return <Tag color="success" className="font-bold">Đã thanh toán</Tag>;
      case "FAILED":
        return <Tag color="error" className="font-bold">Thất bại</Tag>;
      default:
        return <Tag color="warning" className="font-bold">Chưa thanh toán</Tag>;
    }
  };

  const formatPaymentMethod = (method) => {
    switch (method) {
      case "VNPAY":
        return "VNPay";
      case "BANK_TRANSFER":
        return "Chuyển khoản ngân hàng";
      case "COD":
        return "Thanh toán khi nhận hàng (COD)";
      default:
        return method || "Tiền mặt";
    }
  };

  if (loading) {
    return (
      <div className="w-full flex-1 bg-gray-50 flex items-center justify-center py-28">
        <div className="text-center space-y-3">
          <Spin size="large" />
          <p className="text-sm text-gray-500 font-medium">Đang tải thông tin chi tiết từ hệ thống...</p>
        </div>
      </div>
    );
  }

  if (error || !notification) {
    return (
      <div className="w-full flex-1 bg-gray-50 flex flex-col items-center justify-center py-20 px-4">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center max-w-md w-full shadow-sm">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-800 mb-1">Không tìm thấy thông báo</h2>
          <p className="text-sm text-gray-500 mb-6">{error || "Thông báo không tồn tại hoặc đã hết hạn."}</p>
          <Button onClick={handleBack} className="bg-blue-600 text-white hover:bg-blue-700">
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  const order = notification.orderResponse;
  const booking = notification.bookingResponse;

  return (
    <div className="w-full flex-1 bg-gray-50 flex flex-col pb-16">
      {/* Breadcrumb Bar */}
      <div className="w-full bg-white py-3 border-b border-gray-200 shadow-2xs">
        <div className="max-w-[1100px] mx-auto px-4 flex items-center justify-between">
          <Breadcrumb
            items={[
              {
                title: (
                  <span
                    className="text-gray-500 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => navigate("/")}
                  >
                    Trang chủ
                  </span>
                ),
              },
              {
                title: (
                  <span
                    className="text-gray-500 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={handleBack}
                  >
                    Thông báo
                  </span>
                ),
              },
              { title: <span className="text-gray-900 font-semibold">Chi tiết thông báo</span> },
            ]}
          />

          <button
            onClick={handleBack}
            className="text-xs text-gray-500 hover:text-blue-600 font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Quay lại
          </button>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 py-8 w-full flex-1 space-y-6">
        {/* Main Notification Card */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-5">
          <div className="flex items-start gap-4 border-b border-gray-100 pb-5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50/80 flex items-center justify-center shrink-0 border border-blue-100">
              {getIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                <h1 className="text-lg md:text-xl font-black text-gray-900 leading-tight">
                  {notification.title}
                </h1>
                <div className="flex items-center gap-2">
                  <Tag color="blue" className="text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                    {notification.type || "THÔNG BÁO"}
                  </Tag>
                  <Tag color={notification.isRead ? "default" : "green"} className="text-[11px] font-bold">
                    {notification.isRead ? "Đã đọc" : "Mới"}
                  </Tag>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {notification.createdAt
                    ? new Date(notification.createdAt).toLocaleString("vi-VN")
                    : notification.time || "Vừa xong"}
                </span>
              </div>
            </div>
          </div>

          {/* Notification Message Text */}
          <div className="text-gray-800 text-sm md:text-base leading-relaxed whitespace-pre-wrap bg-slate-50/70 p-4 rounded-xl border border-slate-100 font-normal">
            {notification.message || notification.description}
          </div>
        </div>

        {/* ── THÔNG TIN ĐƠN HÀNG LIÊN KẾT (NẾU CÓ) ────────────────────────── */}
        {order && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-0">
            {/* Order Card Header */}
            <div className="p-5 md:p-6 bg-gradient-to-r from-purple-50/60 to-indigo-50/40 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-gray-900 text-base">
                      Đơn hàng #{order.orderCode}
                    </span>
                    {getOrderStatusTag(order.status)}
                  </div>
                  <span className="text-xs text-gray-500">
                    Đặt lúc: {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "N/A"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getPaymentStatusTag(order.paymentStatus)}
                <Tag color="purple" className="font-semibold text-xs">
                  {formatPaymentMethod(order.paymentMethod)}
                </Tag>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-100 bg-white">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thông tin người nhận</h4>
                <div className="space-y-1.5 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="font-semibold text-gray-900">{order.receiverName || "Khách hàng"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{order.receiverPhone || "N/A"}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">{order.shippingAddress || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thanh toán & Ghi chú</h4>
                <div className="space-y-1.5 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>Phương thức: <strong>{formatPaymentMethod(order.paymentMethod)}</strong></span>
                  </div>
                  {order.note && (
                    <div className="text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-gray-600">
                      Ghi chú: {order.note}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Products Table / List */}
            <div className="p-5 md:p-6 space-y-4">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Danh sách sản phẩm</h4>
              {order.items && order.items.length > 0 ? (
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                  {order.items.map((item, idx) => (
                    <div key={item.orderDetailId || idx} className="p-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-100 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                            <ShoppingBag className="w-6 h-6" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{item.productName}</p>
                          <p className="text-xs text-gray-500">
                            Số lượng: <strong className="text-gray-700">{item.quantity}</strong> × {Number(item.unitPrice || 0).toLocaleString("vi-VN")}₫
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-gray-900">
                          {Number(item.totalPrice || (item.unitPrice * item.quantity) || 0).toLocaleString("vi-VN")}₫
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">Không có chi tiết sản phẩm.</p>
              )}

              {/* Price Summary */}
              <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Tiền hàng:</span>
                  <span>{Number(order.totalAmount || 0).toLocaleString("vi-VN")}₫</span>
                </div>
                {order.shippingFee > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Phí vận chuyển:</span>
                    <span>+{Number(order.shippingFee).toLocaleString("vi-VN")}₫</span>
                  </div>
                )}
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Giảm giá:</span>
                    <span>-{Number(order.discountAmount).toLocaleString("vi-VN")}₫</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between items-center text-base font-black text-gray-900">
                  <span>Tổng thanh toán:</span>
                  <span className="text-lg text-blue-600">
                    {Number(order.finalAmount || order.totalAmount || 0).toLocaleString("vi-VN")}₫
                  </span>
                </div>
              </div>

              {/* Order Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 flex-wrap">
                {order.paymentStatus === "PENDING" && order.vnpayUrl && (
                  <a
                    href={order.vnpayUrl}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Thanh toán qua VNPay
                  </a>
                )}
                <button
                  onClick={() => navigate("/my-orders")}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> Quản lý tất cả đơn hàng →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── THÔNG TIN LỊCH HẸN LIÊN KẾT (NẾU CÓ) ────────────────────────── */}
        {booking && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-0">
            <div className="p-5 md:p-6 bg-gradient-to-r from-blue-50/60 to-emerald-50/40 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-gray-900 text-base">
                      Lịch hẹn #{booking.bookingCode}
                    </span>
                    <Tag color="blue" className="font-bold">{booking.status}</Tag>
                  </div>
                  <span className="text-xs text-gray-500">
                    Thời gian: {booking.startTime || "Đang xác nhận"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate("/my-bookings")}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <CalendarCheck className="w-3.5 h-3.5" /> Xem lịch hẹn →
              </button>
            </div>

            <div className="p-5 md:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-700">
              <div>
                <span className="text-xs font-bold text-gray-400 block mb-1">Salon cắt tóc</span>
                <span className="font-bold text-gray-900">{booking.salonName || "BachBarber Premium Salon"}</span>
              </div>
              <div>
                <span className="text-xs font-bold text-gray-400 block mb-1">Stylist phụ trách</span>
                <span className="font-bold text-gray-900">{booking.stylistName || "Đã phân công stylist"}</span>
              </div>
              <div>
                <span className="text-xs font-bold text-gray-400 block mb-1">Trạng thái</span>
                <Tag color="cyan" className="font-bold">{booking.status}</Tag>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Back Button */}
        <div className="pt-2 flex items-center justify-start">
          <button
            onClick={handleBack}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Quay lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationDetailPage;