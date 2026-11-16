import api from "./axiosApi";

/**
 * Fetch public overview and statistics for the "Về chúng tôi" (About Us) page
 * and other public views. Returns live aggregated data directly from the DB.
 */
export const getPublicSystemSummary = () =>
  api.get("/public/about-us").then((r) => r.data);
