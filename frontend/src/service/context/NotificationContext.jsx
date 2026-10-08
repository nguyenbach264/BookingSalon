import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { notification as antdNotification } from "antd";
import { useAuth } from "../../auth/authProvider";
import notificationWs from "../websocket/notificationWebSocket";
import {
  getUserNotifications,
  getNotificationById as apiGetNotificationById,
  markNotificationAsRead as apiMarkRead,
  markAllNotificationsAsRead as apiMarkAllRead,
} from "../api/notificationApi";

const normalizeNotification = (notif) => {
  if (!notif) return notif;
  const isRead = notif.isRead !== undefined ? Boolean(notif.isRead) : Boolean(notif.read);
  return {
    ...notif,
    isRead,
  };
};

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { userInfo, authenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const userId = userInfo?.id;

  // Lấy danh sách thông báo từ API
  const fetchNotifications = useCallback(async () => {
    if (!userId || !authenticated) return;
    setLoading(true);
    try {
      const data = await getUserNotifications(userId);
      const rawList = Array.isArray(data) ? data : [];
      const list = rawList.map(normalizeNotification);
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.isRead).length);
    } catch (err) {
      console.warn("Could not fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, authenticated]);

  // Lấy chi tiết 1 thông báo theo ID từ DB và đánh dấu đã đọc
  const fetchSingleNotification = useCallback(async (notificationId) => {
    if (!notificationId) return null;
    try {
      const data = await apiGetNotificationById(notificationId);
      const normalized = normalizeNotification(data);
      setSelectedNotification(normalized);
      // Cập nhật danh sách local để phản ánh isRead = true và tính lại unreadCount
      setNotifications((prev) => {
        const next = prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n));
        setUnreadCount(next.filter((n) => !n.isRead).length);
        return next;
      });
      return normalized;
    } catch (err) {
      console.warn("Could not fetch single notification:", err);
      return null;
    }
  }, []);

  // Đánh dấu 1 thông báo là đã đọc
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await apiMarkRead(notificationId);
      setNotifications((prev) => {
        const next = prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n));
        setUnreadCount(next.filter((n) => !n.isRead).length);
        return next;
      });
    } catch (err) {
      console.warn("Failed to mark notification as read:", err);
    }
  }, []);

  // Đánh dấu tất cả thông báo là đã đọc
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    try {
      await apiMarkAllRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn("Failed to mark all notifications as read:", err);
    }
  }, [userId]);

  // Hiển thị toast banner khi nhận được thông báo thời gian thực
  const showNotificationToast = useCallback((notif) => {
    const type = notif.type;
    let iconEmoji = "🔔";
    if (type === "BOOKING_CREATED") iconEmoji = "📅";
    else if (type === "BOOKING_CONFIRMED") iconEmoji = "✂️";
    else if (type === "BOOKING_CANCELLED") iconEmoji = "❌";
    else if (type === "ORDER_DELIVERED") iconEmoji = "📦";
    else if (type === "REVIEW_REQUEST" || type === "BOOKING_COMPLETED") iconEmoji = "⭐";

    antdNotification.open({
      message: (
        <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
          <span>{iconEmoji}</span>
          <span>{notif.title || "Thông báo mới từ BachBarber"}</span>
        </span>
      ),
      description: (
        <span className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
          {notif.message}
        </span>
      ),
      placement: "topRight",
      duration: 5,
      className: "rounded-2xl shadow-xl border border-blue-100",
    });
  }, []);

  // Kết nối WebSocket & nạp dữ liệu ban đầu
  useEffect(() => {
    if (!authenticated || !userId) {
      notificationWs.disconnect();
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // 1. Tải danh sách thông báo từ backend
    fetchNotifications();

    // 2. Kết nối WebSocket
    notificationWs.connect({ userId });

    // 3. Lắng nghe thông báo real-time qua WebSocket
    const unsubscribe = notificationWs.subscribe((incoming) => {
      // Chỉ xử lý thông báo gửi riêng cho User này hoặc broadcast
      if (incoming.userId && incoming.userId !== userId) return;

      const incomingNormalized = normalizeNotification(incoming);
      setNotifications((prev) => {
        // Tránh trùng lặp nếu id đã có
        const exists = prev.some((n) => n.id === incomingNormalized.id);
        if (exists) return prev;
        return [incomingNormalized, ...prev];
      });
      setUnreadCount((prev) => prev + 1);

      // Kích hoạt banner thông báo tức thời
      showNotificationToast(incomingNormalized);
    });

    return () => {
      unsubscribe();
      notificationWs.disconnect();
    };
  }, [authenticated, userId, fetchNotifications, showNotificationToast]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        selectedNotification,
        setSelectedNotification,
        fetchSingleNotification,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
};
