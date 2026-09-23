import api from "./axiosApi";

// GET /api/salon
export const getSalons = () => api.get("/salon").then((r) => r.data);

// GET /api/salon/:id
export const getSalonById = (id) => api.get(`/salon/${id}`).then((r) => r.data);

// GET /api/salon/city/:city
export const getSalonsByCity = (city) =>
  api.get(`/salon/city/${city}`).then((r) => r.data);

