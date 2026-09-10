import { Carousel, message } from 'antd';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useReviewWebSocket from '../../hooks/useReviewWebSocket';
import { getReviews, createReview } from '../../service/api/reviewApi';

const MOCK_CAROUSEL_IMAGES = [
  'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&h=450&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&h=450&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=1200&h=450&auto=format&fit=crop&q=80',
];

const MOCK_HOME_SERVICES = [
  {
    category: "Dịch vụ tóc",
    items: [
      {
        id: 1,
        name: "Cắt tóc nam chuẩn 30Shine",
        image: "https://images.unsplash.com/photo-1598524374912-628cbcddbc1f?w=500&auto=format&fit=crop&q=60"
      },
      {
        id: 2,
        name: "Uốn tóc Hàn Quốc",
        image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=60"
      },
      {
        id: 3,
        name: "Nhuộm tóc thời trang",
        image: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=500&auto=format&fit=crop&q=60"
      }
    ]
  },
  {
    category: "Thư giãn và chăm sóc",
    items: [
      {
        id: 4,
        name: "Gội đầu massage VIP",
        image: "https://images.unsplash.com/photo-1516975080661-46bfa33f93a1?w=500&auto=format&fit=crop&q=60"
      },
      {
        id: 5,
        name: "Chăm sóc da mặt cơ bản",
        image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&auto=format&fit=crop&q=60"
      },
      {
        id: 6,
        name: "Lấy mụn chuyên sâu",
        image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=500&auto=format&fit=crop&q=60"
      }
    ]
  }
];

const HomeContent = () => {

  const navigate = useNavigate();

  const [reviewContent, setReviewContent] = useState("");

  const [reviews, setReviews] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lấy reviews cũ
  useEffect(() => {

    const loadReviews = async () => {
      try {
        const data = await getReviews();

        console.log("📦 Init data: ", data);

        setReviews(data);

      } catch (error) {
        console.error("Load reviews error:", error);
      }
    };

    loadReviews();

  }, []);

  // HANDLE NEW REVIEW FROM WEBSOCKET
  const handleNewReview = useCallback((newReview) => {
    setReviews((prevReviews) => {
      /*
      * Tránh duplicate review
      */
      const exists = prevReviews.some(
        (review) =>
          review.id === newReview.id
      );

      if (exists) {
        console.log("⚠️ Review already exists:", newReview.id);
        return prevReviews;
      }
      console.log("🆕 Adding new review:", newReview);

      return [
        ...prevReviews,
        newReview,
      ];
    });
  }, []);

  useReviewWebSocket({ onNewReview: handleNewReview, });


  // CREATE REVIEW
  const handleSubmit = async () => {
    const content = reviewContent.trim();
    if (!content) return;
    try {
      setIsSubmitting(true);
      const createdReview = await createReview({
        userId: "10000000-0000-0000-0000-000000000008",
        type: "NEW_REVIEW",
        reviewContent: content
      });
      console.log("Review created:", createdReview);
      setReviewContent("");
      setReviews((prevReviews) => [
        ...prevReviews,
        createdReview,
      ]);

      message.success("Đánh giá đã được gửi");
    } catch (error) {
      console.error("Submit review error:", error);
      message.error("Không thể gửi đánh giá");
    } finally {
      setIsSubmitting(false);
    }
  };

  const CustomArrow = ({ direction, onClick }) => (
    <div
      className={`absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full border-2 border-white/80 text-white cursor-pointer hover:bg-white/20 transition-all ${direction === 'left' ? 'left-4' : 'right-4'}`}
      onClick={onClick}
    >
      {direction === 'left' ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
    </div>
  );

  return (
    <div className="w-full flex-1 bg-white flex flex-col pb-16">
      <div className="w-full mb-12 relative group select-none">
        <Carousel
          autoplay
          draggable
          swipeToSlide
          dots={true}
          arrows={true}
          prevArrow={<CustomArrow direction="left" />}
          nextArrow={<CustomArrow direction="right" />}
          customPaging={(i) => (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-white/80 transition-all duration-300 custom-dot-element shadow-sm mt-1"></div>
          )}
          className="custom-dots"
        >
          {MOCK_CAROUSEL_IMAGES.map(
            (src, i) => (
              <div
                key={i}
                className="w-full outline-none"
              >
                <div className="h-[300px] md:h-[450px] w-full overflow-hidden bg-gray-100 cursor-grab active:cursor-grabbing relative">
                  <img
                    src={src}
                    className="w-full h-full object-cover pointer-events-none"
                    alt={`banner-${i}`}
                  />
                </div>
              </div>
            )
          )}
        </Carousel>
      </div>
      <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8">
        {MOCK_HOME_SERVICES.map(
          (section, idx) => (
            <div
              key={idx}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold mb-6 text-gray-800 border-l-4 border-blue-600 pl-3">
                {section.category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.items.map(
                  (item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col hover:shadow-lg hover:border-blue-400 transition-all duration-300 group cursor-pointer"
                      onClick={() =>
                        navigate("/service")
                      }
                    >
                      <div className="h-48 w-full overflow-hidden bg-gray-100 relative">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors">
                        </div>
                      </div>
                      <div className="p-6 flex flex-col items-center justify-center text-center flex-1 bg-gray-50 group-hover:bg-white transition-colors">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4 group-hover:text-blue-600 transition-colors">
                          {item.name}
                        </h3>
                        <button
                          className="text-blue-600 font-medium flex items-center gap-1 hover:underline"
                        >
                          Xem chi tiết
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )
        )}
      </div>
      <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="py-8 bg-gray-100 rounded-lg">
          {reviews.length === 0 ? (
            <p className="text-gray-500 px-4">
              Chưa có đánh giá nào.
            </p>
          ) : (
            <div className="space-y-4 px-4">
              {reviews.map(
                (review, index) => (
                  <div
                    key={
                      review.id ?? index
                    }
                    className="bg-white p-4 rounded-lg shadow-sm"
                  >
                    <div className="font-semibold">
                      {review.username ?? "Khách hàng"}
                    </div>
                    <p className="text-gray-700 mt-1">
                      {review.reviewContent}
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
        <div className="w-full flex items-center justify-between gap-4 mt-4">
          <input
            type="text"
            value={reviewContent}
            onChange={(e) => setReviewContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isSubmitting) {
                handleSubmit();
              }
            }}
            placeholder="Nhập đánh giá của bạn về các dịch vụ của chúng tôi..."
            disabled={isSubmitting}
            className="border border-gray-300 rounded-md flex-1 py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!reviewContent.trim() || isSubmitting}
            className="bg-blue-300 py-2 px-8 rounded-2xl hover:bg-blue-400 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Đang gửi..." : "Gửi"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeContent;