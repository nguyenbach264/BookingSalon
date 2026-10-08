import api from "./axiosApi";

export const productApi = {
  getProducts: async (params = {}) => {
    const response = await api.get("/products", { params });
    return response.data;
  },

  getProductCategories: async () => {
    const response = await api.get("/product-categories");
    return response.data;
  },

  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
};

export const getProducts = productApi.getProducts;
export const getProductCategories = productApi.getProductCategories;
export const getProductById = productApi.getProductById;

export default productApi;

