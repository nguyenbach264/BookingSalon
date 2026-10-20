export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
export const HTTP_REVIEW_URL = `${API_BASE_URL}/api/reviews`; 
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || (API_BASE_URL.replace(/^http/, "ws"));
export const WS_REVIEW_URL = `${WS_BASE_URL}/ws/reviews`; 
export const WS_NOTIFICATION_URL = `${WS_BASE_URL}/ws/notifications`; 