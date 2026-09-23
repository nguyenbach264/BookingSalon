import api from "./axiosApi";

// GET /api/booking/user/:id/status/:status
export const getBookingsByUserAndStatus = (userId, status) =>
  api.get(`/booking/user/${userId}/status/${status}`).then((r) => r.data);

// GET /api/booking/stylist/:id
export const getBookingsByStylist = (stylistId) =>
  api.get(`/booking/stylist/${stylistId}`).then((r) => r.data);

// GET /api/booking/stylist/:id/status/:status
export const getBookingsByStylistAndStatus = (stylistId, status) =>
  api.get(`/booking/stylist/${stylistId}/status/${status}`).then((r) => r.data);

// GET /api/booking/statistics/stylist/:stylistId
export const getStylistStatistics = (stylistId) =>
  api.get(`/booking/statistics/stylist/${stylistId}`).then((r) => r.data);

// GET /api/booking/statistics
export const getGlobalStatistics = () =>
  api.get("/booking/statistics").then((r) => r.data);

// POST /api/booking
export const createBooking = (payload) =>
  api.post("/booking", payload).then((r) => r.data);

// GET /api/stylists
export const getAllStylists = () =>
  api.get("/stylists").then((r) => r.data);

// GET /api/stylists/salon/:salonId
export const getStylistsBySalon = (salonId) =>
  api.get(`/stylists/salon/${salonId}`).then((r) => r.data);

// GET /api/booking
export const getAllBookings = () =>
  api.get("/booking").then((r) => r.data);

// GET /api/stylists/:id/services
export const getStylistServices = (stylistId) =>
  api.get(`/stylists/${stylistId}/services`).then((r) => r.data);

// GET /api/booking/stylist/:stylistId/booked-slots?date=YYYY-MM-DD
export const getStylistBookedSlots = (stylistId, date) =>
  api.get(`/booking/stylist/${stylistId}/booked-slots`, { params: { date } }).then((r) => r.data);

