import { HTTP_REVIEW_URL } from "../../config/api.js"; 

// Lấy toàn bộ review
export const getReviews = async () => {
  const response = await fetch(HTTP_REVIEW_URL);
  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      errorText || "Không thể lấy danh sách đánh giá"
    );
  }

  return response.json();
};

// Tạo review mới
export const createReview = async ({ userId, type, reviewContent, }) => {
  const response = await fetch(HTTP_REVIEW_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      type,
      reviewContent,
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      errorText || "Không thể gửi đánh giá"
    );
  }

  return response.json();
};