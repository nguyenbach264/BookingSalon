import api from "./axiosApi";

// Lấy danh sách voucher khả dụng cho user (bao gồm voucher công khai và voucher riêng)
export const getAvailableVouchers = (userId) =>
  api.get("/vouchers/available", { params: { userId } }).then((r) => r.data);

// Kiểm tra và áp dụng mã voucher lên đơn hàng
export const applyVoucher = (voucherCode, orderAmount, userId) =>
  api.post("/vouchers/apply", { voucherCode, orderAmount, userId }).then((r) => r.data);

// Dành cho ADMIN: Lấy tất cả voucher hệ thống
export const getAdminVouchers = () =>
  api.get("/vouchers/admin").then((r) => r.data);

// Dành cho ADMIN: Tạo voucher mới
export const createVoucher = (payload) =>
  api.post("/vouchers/admin", payload).then((r) => r.data);

// Dành cho ADMIN: Xóa mềm voucher
export const deleteVoucher = (id) =>
  api.delete(`/vouchers/admin/${id}`).then((r) => r.data);

