import api from "./axiosApi";

// GET /api/service-offering
export const getServiceOfferings = () =>
  api.get("/service-offering").then((r) => r.data);

// GET /api/service-offering/:id
export const getServiceOfferingById = (id) =>
  api.get(`/service-offering/${id}`).then((r) => r.data);

