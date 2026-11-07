import api from "./axiosApi";

export const orderApi = {
  createOrder: async (orderData, idempotencyKey = null) => {
    const headers = {};
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }
    const response = await api.post("/orders", orderData, { headers });
    return response.data;
  },

  getUserOrders: async (userId) => {
    const response = await api.get(`/orders/user/${userId}`);
    return response.data;
  },

  getOrderById: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  cancelOrder: async (orderId) => {
    const response = await api.put(`/orders/${orderId}/cancel`);
    return response.data;
  },

  getOrderVnPayUrl: async (orderId) => {
    const response = await api.get(`/orders/${orderId}/vnpay-url`);
    return response.data?.vnpayUrl;
  },
};

export default orderApi;

