import api from "./axiosApi";

// Lấy danh sách thông báo của user
export const getUserNotifications = (userId) =>
  api.get(`/notifications/user/${userId}`).then((r) => r.data);

// Đánh dấu 1 thông báo đã đọc
export const markNotificationAsRead = (notificationId) =>
  api.put(`/notifications/${notificationId}/read`).then((r) => r.data);

// Đánh dấu tất cả thông báo của user đã đọc
export const markAllNotificationsAsRead = (userId) =>
  api.put(`/notifications/user/${userId}/read-all`).then((r) => r.data);

// Tạo thông báo mới (nếu cần từ client)
export const createNotification = (data) =>
  api.post("/notifications", data).then((r) => r.data);