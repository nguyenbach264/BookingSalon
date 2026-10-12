import api from "./axiosApi";

// GET /api/salon
export const getSalons = () => api.get("/salon").then((r) => r.data);

// GET /api/salon/:id
export const getSalonById = (id) => api.get(`/salon/${id}`).then((r) => r.data);

// GET /api/salon/city/:city
export const getSalonsByCity = (city) =>
  api.get(`/salon/city/${city}`).then((r) => r.data);

// POST /api/salon (Create salon)
export const createSalon = (data) => api.post("/salon", data).then((r) => r.data);

// PUT /api/salon (Update salon)
export const updateSalon = (data) => api.put("/salon", data).then((r) => r.data);

// DELETE /api/salon/:id (Delete salon)
export const deleteSalon = (id) => api.delete(`/salon/${id}`).then((r) => r.data);

