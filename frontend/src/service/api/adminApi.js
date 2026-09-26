import api from "./axiosApi";

// GET /api/product  (uses existing products endpoint – check controller)
export const getProducts = () =>
  api.get("/product").then((r) => r.data).catch(() =>
    // fallback if endpoint path differs
    api.get("/products").then((r) => r.data)
  );

// GET /api/users (all users - admin only)
export const getUsers = () =>
  api.get("/users").then((r) => r.data);

// GET /api/users/:id
export const getUserById = (id) =>
  api.get(`/users/${id}`).then((r) => r.data);

// GET /api/stylists (all stylists)
export const getStylists = () =>
  api.get("/stylists").then((r) => r.data);

// GET /api/stylists/:id
export const getStylistById = (id) =>
  api.get(`/stylists/${id}`).then((r) => r.data);

// GET /api/stylists/:id/services
export const getStylistServices = (id) =>
  api.get(`/stylists/${id}/services`).then((r) => r.data);

// PUT /api/booking/:id/status
export const updateBookingStatus = (bookingId, status) =>
  api.post(`/booking/${bookingId}?status=${status}`).then((r) => r.data);

// GET /api/admin/products (with optional search, categoryId)
export const getAdminProducts = (params = {}) =>
  api.get('/admin/products', { params }).then((r) => r.data);

// POST /api/admin/products
export const createAdminProduct = (data) =>
  api.post('/admin/products', data).then((r) => r.data);

// PUT /api/admin/products/:id
export const updateAdminProduct = (id, data) =>
  api.put(`/admin/products/${id}`, data).then((r) => r.data);

// DELETE /api/admin/products/:id
export const deleteAdminProduct = (id) =>
  api.delete(`/admin/products/${id}`).then((r) => r.data);

// GET /api/admin/products/stats
export const getAdminProductStats = () =>
  api.get('/admin/products/stats').then((r) => r.data);

// GET /api/admin/orders
export const getAdminOrders = (status) =>
  api.get('/admin/orders', { params: status ? { status } : {} }).then((r) => r.data);

// PUT /api/admin/orders/:id/status
export const updateAdminOrderStatus = (id, status) =>
  api.put(`/admin/orders/${id}/status`, null, { params: { status } }).then((r) => r.data);

// GET /api/reviews (all reviews for admin)
export const getAdminReviews = () =>
  api.get('/reviews').then((r) => r.data);

// DELETE /api/reviews/:id
export const deleteAdminReview = (id) =>
  api.delete(`/reviews/${id}`).then((r) => r.data);

