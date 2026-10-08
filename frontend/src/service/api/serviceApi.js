import api from "./axiosApi";

// GET /api/service-offering (with optional salonId)
export const getServiceOfferings = (salonId) =>
  api.get("/service-offering", { params: salonId ? { salonId } : {} }).then((r) => r.data);

// GET /api/service-offering/:id
export const getServiceOfferingById = (id) =>
  api.get(`/service-offering/${id}`).then((r) => r.data);

// GET /api/categories
export const getServiceCategories = () =>
  api.get("/categories").then((r) => r.data);
