import api from "./axiosApi";

export const getProducts = () =>
  api.get("/product").then((r) => r.data).catch(() =>
    api.get("/products").then((r) => r.data)
  );

export const getUsers = () =>
  api.get("/users").then((r) => r.data);

export const getUserById = (id) =>
  api.get(`/users/${id}`).then((r) => r.data);

export const getStylists = () =>
  api.get("/stylists").then((r) => r.data);

export const getStylistById = (id) =>
  api.get(`/stylists/${id}`).then((r) => r.data);

export const getStylistServices = (id) =>
  api.get(`/stylists/${id}/services`).then((r) => r.data);

export const updateBookingStatus = (bookingId, status) =>
  api.post(`/booking/${bookingId}?status=${status}`).then((r) => r.data);

export const getAdminProducts = (params = {}) =>
  api.get('/admin/products', { params }).then((r) => r.data);

export const createAdminProduct = (data) =>
  api.post('/admin/products', data).then((r) => r.data);

export const updateAdminProduct = (id, data) =>
  api.put(`/admin/products/${id}`, data).then((r) => r.data);

export const deleteAdminProduct = (id) =>
  api.delete(`/admin/products/${id}`).then((r) => r.data);

export const getAdminProductStats = () =>
  api.get('/admin/products/stats').then((r) => r.data);

export const getAdminOrders = (status) =>
  api.get('/admin/orders', { params: status ? { status } : {} }).then((r) => r.data);

export const updateAdminOrderStatus = (id, status) =>
  api.put(`/admin/orders/${id}/status`, null, { params: { status } }).then((r) => r.data);

export const getAdminReviews = () =>
  api.get('/reviews').then((r) => r.data);

export const deleteAdminReview = (id) =>
  api.delete(`/reviews/${id}`).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// ADMIN STYLIST MANAGEMENT APIS
// ─────────────────────────────────────────────────────────────
export const getAdminStylists = (params = {}) =>
  api.get('/admin/stylists', { params }).then((r) => r.data);

export const getAdminStylistDetail = (id) =>
  api.get(`/admin/stylists/${id}`).then((r) => r.data);

export const promoteUserToStylist = (data) =>
  api.post('/admin/stylists/promote', data).then((r) => r.data);

export const terminateStylist = (id, data = {}) =>
  api.post(`/admin/stylists/${id}/terminate`, data).then((r) => r.data);

export const assignStylistServices = (id, serviceIds) =>
  api.post(`/admin/stylists/${id}/services`, { serviceIds }).then((r) => r.data);

export const removeStylistService = (id, serviceId) =>
  api.delete(`/admin/stylists/${id}/services/${serviceId}`).then((r) => r.data);

export const updateStylistSalaryConfig = (id, data) =>
  api.put(`/admin/stylists/${id}/salary-config`, data).then((r) => r.data);

export const getStylistPayroll = (id, params = {}) =>
  api.get(`/admin/stylists/${id}/payroll`, { params }).then((r) => r.data);

export const getEligibleUsersForPromotion = (params = {}) =>
  api.get('/admin/stylists/eligible-users', { params }).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// ADMIN SERVICE MANAGEMENT APIS
// ─────────────────────────────────────────────────────────────
export const getAdminServices = (params = {}) =>
  api.get('/admin/services', { params }).then((r) => r.data);

export const createAdminService = (data) =>
  api.post('/admin/services', data).then((r) => r.data);

export const updateAdminService = (id, data) =>
  api.put(`/admin/services/${id}`, data).then((r) => r.data);

export const deleteAdminService = (id) =>
  api.delete(`/admin/services/${id}`).then((r) => r.data);

export const createServiceSuspension = (data) =>
  api.post('/admin/services/suspensions', data).then((r) => r.data);

export const getServiceSuspensions = (params = {}) =>
  api.get('/admin/services/suspensions', { params }).then((r) => r.data);

export const deactivateServiceSuspension = (id) =>
  api.put(`/admin/services/suspensions/${id}/deactivate`).then((r) => r.data);
