import React, { useState, useEffect, useCallback } from 'react';
import {
  Tabs,
  Card,
  Tag,
  Button,
  Rate,
  Input,
  Modal,
  message,
  Spin,
  Empty,
  Badge,
  Row,
  Col,
  Divider,
} from 'antd';
import {
  ClockCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  StarOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  ScissorOutlined,
  DollarOutlined,
  MessageOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/authProvider';
import {
  getMyBookings,
  getMyReviews,
  submitReview,
  cancelMyBooking,
} from '../../service/api/userApi';
import notificationWs from '../../service/websocket/notificationWebSocket';

const { TextArea } = Input;

export default function MyBookingsPage() {
  const { userInfo } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [ratingVal, setRatingVal] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadData = useCallback(async () => {
    if (!userInfo?.id) return;
    setLoading(true);
    try {
      const [bookingsData, reviewsData] = await Promise.all([
        getMyBookings(userInfo.id).catch(() => []),
        getMyReviews(userInfo.id).catch(() => []),
      ]);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
    } catch (err) {
      console.error('Error fetching bookings/reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [userInfo?.id]);

  const loadDataQuietly = useCallback(async () => {
    if (!userInfo?.id) return;
    try {
      const [bookingsData, reviewsData] = await Promise.all([
        getMyBookings(userInfo.id).catch(() => []),
        getMyReviews(userInfo.id).catch(() => []),
      ]);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
    } catch (err) {
      console.error('Error fetching bookings/reviews quietly:', err);
    }
  }, [userInfo?.id]);

  useEffect(() => {
    loadData();
    const unsub = notificationWs.subscribe(() => {
      loadDataQuietly();
    });
    return () => unsub();
  }, [loadData, loadDataQuietly]);

  // Tab filters
  const pendingBookings = bookings.filter((b) => b.status === 'PENDING');
  const inProgressBookings = bookings.filter(
    (b) => b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS'
  );
  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED');
  const cancelledBookings = bookings.filter((b) => b.status === 'CANCELLED');

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

  const formatDateTime = (dt) => {
    if (!dt) return '—';
    try {
      const d = Array.isArray(dt) ? new Date(...dt) : new Date(dt);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return String(dt);
    }
  };

  const handleCancel = (bookingId) => {
    Modal.confirm({
      title: 'Hủy lịch hẹn',
      content: 'Bạn có chắc chắn muốn hủy lịch hẹn này không?',
      okText: 'Hủy lịch',
      cancelText: 'Giữ lại',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await cancelMyBooking(bookingId);
          message.success('Đã hủy lịch hẹn thành công!');
          loadData();
        } catch (err) {
          message.error('Không thể hủy lịch. Vui lòng liên hệ salon!');
        }
      },
    });
  };

  const openReviewModal = (booking) => {
    setReviewBooking(booking);
    setRatingVal(5);
    setReviewComment('');
    setReviewModalOpen(true);
  };

  const handleSendReview = async () => {
    if (!reviewComment.trim()) {
      message.warning('Vui lòng chia sẻ đôi lời cảm nhận của bạn!');
      return;
    }
    try {
      setSubmittingReview(true);
      await submitReview({
        userId: userInfo?.id,
        bookingId: reviewBooking?.id,
        stylistId: reviewBooking?.stylistId,
        salonId: reviewBooking?.salonId,
        rating: ratingVal,
        reviewContent: reviewComment.trim(),
        type: 'SERVICE',
      });
      message.success('Cảm ơn bạn đã gửi đánh giá trải nghiệm!');
      setReviewModalOpen(false);
      loadData();
      setActiveTab('REVIEWS');
    } catch (err) {
      console.error(err);
      message.error('Không thể gửi đánh giá. Vui lòng thử lại sau!');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderBookingCard = (b, isCompleted = false) => {
    return (
      <div
        key={b.id || b.bookingCode}
        className="bg-white rounded-2xl border border-gray-100 hover:border-blue-300 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
      >
        <div>
          {/* Header row: Code & Status */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-xs text-[#60a5fa] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                {b.bookingCode || 'BB-2026'}
              </span>
              <span className="text-xs text-gray-400">
                {formatDateTime(b.startTime)}
              </span>
            </div>
            <div>
              {b.status === 'PENDING' && (
                <Tag color="gold" className="rounded-full text-xs font-bold border-none px-3 py-0.5">
                  Chờ xác nhận
                </Tag>
              )}
              {b.status === 'CONFIRMED' && (
                <Tag color="processing" className="rounded-full text-xs font-bold border-none px-3 py-0.5">
                  Đã duyệt (Chờ phục vụ)
                </Tag>
              )}
              {b.status === 'IN_PROGRESS' && (
                <Tag color="purple" className="rounded-full text-xs font-bold border-none px-3 py-0.5">
                  Đang phục vụ
                </Tag>
              )}
              {b.status === 'COMPLETED' && (
                <Tag color="success" className="rounded-full text-xs font-bold border-none px-3 py-0.5">
                  Hoàn tất
                </Tag>
              )}
              {b.status === 'CANCELLED' && (
                <Tag color="error" className="rounded-full text-xs font-bold border-none px-3 py-0.5">
                  Đã hủy
                </Tag>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2.5 text-sm text-gray-700 mb-6">
            <div className="flex items-center gap-2.5">
              <EnvironmentOutlined className="text-[#60a5fa] shrink-0" />
              <span className="font-semibold text-gray-900">{b.salonName || 'Salon BachBarber'}</span>
              {b.salonAddress && (
                <span className="text-xs text-gray-400 truncate">({b.salonAddress})</span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <ScissorOutlined className="text-[#60a5fa] shrink-0" />
              <span>Stylist:</span>
              <strong className="text-gray-900">{b.stylistName || 'Chuyên viên Salon'}</strong>
            </div>

            <div className="flex items-center gap-2.5">
              <DollarOutlined className="text-[#60a5fa] shrink-0" />
              <span>Tổng chi phí:</span>
              <span className="font-black text-[#60a5fa] text-base">
                {formatPrice(b.totalAmount)}
              </span>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                {b.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt'}
              </span>
            </div>

            {b.customerNotes && (
              <div className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <span className="font-semibold text-gray-700">Ghi chú: </span>
                {b.customerNotes}
              </div>
            )}
          </div>
        </div>

        {/* Action Button Row */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
          {b.status === 'PENDING' && (
            <Button
              danger
              size="small"
              onClick={() => handleCancel(b.id)}
              className="rounded-xl text-xs font-semibold"
            >
              Hủy lịch
            </Button>
          )}

          {b.status === 'CONFIRMED' && (
            <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
              <CheckCircleOutlined /> Stylist đã sẵn sàng đón tiếp
            </span>
          )}

          {isCompleted && (
            <div className="w-full flex items-center justify-between">
              {b.isReviewed ? (
                <Tag color="blue" className="rounded-full text-xs font-bold border-none py-1 px-3">
                  ★ Đã gửi đánh giá
                </Tag>
              ) : (
                <Button
                  type="primary"
                  icon={<StarOutlined />}
                  onClick={() => openReviewModal(b)}
                  className="bg-[#60a5fa] hover:bg-blue-500 text-white font-bold rounded-xl text-xs h-9 shadow-sm"
                >
                  Xác nhận & Đánh giá
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#60a5fa] border border-blue-200 mb-2">
            <CalendarOutlined /> LỊCH HẸN DỊCH VỤ CỦA BẠN
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-0">
            Dịch Vụ Đã Đặt
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-medium shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Tự động cập nhật</span>
          </div>
          <Button
            type="primary"
            onClick={() => navigate('/booking')}
            className="bg-[#60a5fa] hover:bg-blue-500 rounded-xl font-bold text-xs h-9 shadow-sm"
          >
            + Đặt lịch mới
          </Button>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="custom-tabs"
          items={[
            {
              key: 'PENDING',
              label: (
                <span className="flex items-center gap-2 font-bold px-2 py-1 text-sm">
                  <ClockCircleOutlined className="text-amber-500" />
                  Chờ xác nhận
                  <Badge count={pendingBookings.length} size="small" style={{ backgroundColor: '#f59e0b' }} />
                </span>
              ),
              children: loading ? (
                <div className="py-20 text-center"><Spin tip="Đang tải dữ liệu..." /></div>
              ) : pendingBookings.length === 0 ? (
                <Empty description="Không có lịch hẹn nào đang chờ xác nhận." className="py-12" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
                  {pendingBookings.map((b) => renderBookingCard(b))}
                </div>
              ),
            },
            {
              key: 'CONFIRMED',
              label: (
                <span className="flex items-center gap-2 font-bold px-2 py-1 text-sm">
                  <SyncOutlined className="text-blue-500" />
                  Chờ xử lý
                  <Badge count={inProgressBookings.length} size="small" style={{ backgroundColor: '#60a5fa' }} />
                </span>
              ),
              children: loading ? (
                <div className="py-20 text-center"><Spin tip="Đang tải dữ liệu..." /></div>
              ) : inProgressBookings.length === 0 ? (
                <Empty description="Không có lịch hẹn nào đang trong tiến trình chờ phục vụ." className="py-12" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
                  {inProgressBookings.map((b) => renderBookingCard(b))}
                </div>
              ),
            },
            {
              key: 'COMPLETED',
              label: (
                <span className="flex items-center gap-2 font-bold px-2 py-1 text-sm">
                  <CheckCircleOutlined className="text-green-500" />
                  Đã đặt
                  <Badge count={completedBookings.length} size="small" style={{ backgroundColor: '#10b981' }} />
                </span>
              ),
              children: loading ? (
                <div className="py-20 text-center"><Spin tip="Đang tải dữ liệu..." /></div>
              ) : completedBookings.length === 0 ? (
                <Empty description="Bạn chưa có lịch hẹn nào hoàn tất." className="py-12" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
                  {completedBookings.map((b) => renderBookingCard(b, true))}
                </div>
              ),
            },
            {
              key: 'REVIEWS',
              label: (
                <span className="flex items-center gap-2 font-bold px-2 py-1 text-sm">
                  <StarOutlined className="text-amber-500" />
                  Đánh giá
                  <Badge count={reviews.length} size="small" style={{ backgroundColor: '#8b5cf6' }} />
                </span>
              ),
              children: loading ? (
                <div className="py-20 text-center"><Spin tip="Đang tải đánh giá..." /></div>
              ) : reviews.length === 0 ? (
                <Empty description="Bạn chưa có đánh giá nào. Khi lịch hẹn hoàn tất, hãy gửi đánh giá nhé!" className="py-12" />
              ) : (
                <div className="space-y-4 pt-4">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-3">
                          <Rate disabled defaultValue={rev.rating || 5} className="text-amber-400 text-sm" />
                          <span className="text-xs text-gray-400">
                            {formatDateTime(rev.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-800 text-sm font-medium mb-0 leading-relaxed">
                          "{rev.reviewContent}"
                        </p>
                      </div>

                      <Tag color="purple" className="rounded-full text-xs font-bold border-none px-3 py-1">
                        Dịch vụ Salon
                      </Tag>
                    </div>
                  ))}
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* Review Modal */}
      <Modal
        open={reviewModalOpen}
        onCancel={() => setReviewModalOpen(false)}
        footer={null}
        centered
        width={460}
        className="rounded-3xl overflow-hidden"
      >
        <div className="p-4 text-center">
          <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100 shadow-sm">
            <StarOutlined className="text-2xl" />
          </div>

          <h2 className="text-xl font-black text-gray-900 mb-1">Đánh Giá Dịch Vụ</h2>
          <p className="text-gray-500 text-xs mb-6">
            Mã lịch hẹn: <strong className="text-gray-800">{reviewBooking?.bookingCode}</strong>
            <br />
            Chuyên viên Stylist: <strong className="text-[#60a5fa]">{reviewBooking?.stylistName || 'Stylist Salon'}</strong>
          </p>

          <div className="mb-6 flex flex-col items-center">
            <span className="text-xs font-bold text-gray-600 uppercase mb-2">Mức độ hài lòng</span>
            <Rate
              value={ratingVal}
              onChange={setRatingVal}
              className="text-amber-400 text-3xl"
            />
          </div>

          <div className="mb-6 text-left">
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
              Nhận xét chi tiết
            </label>
            <TextArea
              rows={4}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm làm tóc, sự nhiệt tình của Stylist và không gian salon..."
              className="rounded-xl"
            />
          </div>

          <Button
            type="primary"
            block
            loading={submittingReview}
            onClick={handleSendReview}
            className="bg-[#60a5fa] hover:bg-blue-500 text-white font-bold h-12 rounded-xl text-sm shadow-md"
          >
            Gửi đánh giá ngay
          </Button>
        </div>
      </Modal>
    </div>
  );
}

