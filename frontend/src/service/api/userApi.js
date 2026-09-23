import api from './axiosApi';

// Lấy thông tin cá nhân của người dùng hiện tại
export const getMyProfile = () =>
  api.get('/users/me').then((r) => r.data);

// Cập nhật thông tin cá nhân
export const updateMyProfile = (payload) =>
  api.put('/users/me', payload).then((r) => r.data);

// Gửi mã OTP xác thực Email
export const sendVerifyEmailOtp = () =>
  api.post('/users/me/send-verify-email').then((r) => r.data);

// Xác thực mã OTP Email
export const verifyEmailOtp = (otp) =>
  api.post('/users/me/verify-email', { otp }).then((r) => r.data);

// Lấy danh sách toàn bộ lịch đặt của user
export const getMyBookings = (userId) =>
  api.get(`/booking/user/${userId}`).then((r) => r.data);

// Lấy danh sách đánh giá của user
export const getMyReviews = (userId) =>
  api.get(`/reviews/user/${userId}`).then((r) => r.data);

// Gửi đánh giá dịch vụ sau khi hoàn thành
export const submitReview = (payload) =>
  api.post('/reviews', payload).then((r) => r.data);

// Hủy lịch hẹn
export const cancelMyBooking = (bookingId) =>
  api.post(`/booking/${bookingId}?status=CANCELLED`).then((r) => r.data);

