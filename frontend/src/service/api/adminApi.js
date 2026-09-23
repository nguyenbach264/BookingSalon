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

