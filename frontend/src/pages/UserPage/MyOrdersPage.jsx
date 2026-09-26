import React, { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Empty, Spin, Tag, message, Popconfirm } from 'antd';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  QrCode, 
  Copy, 
  ArrowRight, 
  AlertCircle,
  Package,
  Calendar,
  MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/authProvider';
import orderApi from '../../service/api/orderApi';
import notificationWs from '../../service/websocket/notificationWebSocket';

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const { userInfo, authenticated } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  // Modal QR State for pending bank transfer orders
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!userInfo?.id) return;
    setLoading(true);
    try {
      const data = await orderApi.getUserOrders(userInfo.id);
      setOrders(data || []);
    } catch (err) {
      console.error("Failed to load user orders:", err);
      message.error("Không thể tải danh sách đơn hàng. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  }, [userInfo?.id]);

  useEffect(() => {
    // Route đã được bảo vệ bởi ProtectedRoute trong AppRoutes
    // Không cần gọi openLoginModal ở đây — tránh flash modal giả khi refresh trang
    if (authenticated && userInfo?.id) {
      fetchOrders();
    }
  }, [authenticated, userInfo?.id, fetchOrders]);

  // Real-time WebSocket listener for order updates
  useEffect(() => {
    if (!userInfo?.id) return;

    notificationWs.connect({ userId: userInfo.id });

    const unsubscribe = notificationWs.subscribe((payload) => {
      if (!payload) return;

      if (
        payload.type === 'ORDER_PAID' ||
        payload.type === 'ORDER_STATUS_CHANGED' ||
        payload.type === 'ORDER_CANCELLED' ||
        payload.type === 'NEW_ORDER'
      ) {
        // Refresh orders silently in real-time
        fetchOrders();

        if (selectedOrderForPayment && payload.orderCode === selectedOrderForPayment.orderCode && payload.type === 'ORDER_PAID') {
          message.success(`Đơn hàng ${payload.orderCode} đã được thanh toán thành công!`);
          setQrModalVisible(false);
          setSelectedOrderForPayment(null);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [userInfo?.id, fetchOrders, selectedOrderForPayment]);

  const handleCancelOrder = async (orderId) => {
    if (!orderId) {
      message.error("Không tìm thấy mã đơn hàng để hủy!");
      return;
    }
    setCancellingOrderId(orderId);
    try {
      await orderApi.cancelOrder(orderId);
      message.success("Hủy đơn hàng thành công!");
      fetchOrders();
    } catch (err) {
      console.error("Cancel order error:", err);
      const errMsg = err.response?.data?.message || err.message || "Hủy đơn hàng thất bại!";
      message.error(errMsg);
    } finally {
      setCancellingOrderId(null);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    message.success(`Đã sao chép ${label}!`);
  };

  const formatPrice = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <Tag color="warning" className="rounded-md font-semibold text-xs py-0.5">Chờ xác nhận</Tag>;
      case 'CONFIRMED':
        return <Tag color="processing" className="rounded-md font-semibold text-xs py-0.5">Đã xác nhận</Tag>;
      case 'SHIPPING':
        return <Tag color="blue" className="rounded-md font-semibold text-xs py-0.5">Đang giao hàng</Tag>;
      case 'COMPLETED':
        return <Tag color="success" className="rounded-md font-semibold text-xs py-0.5">Giao thành công</Tag>;
      case 'CANCELLED':
        return <Tag color="default" className="rounded-md font-semibold text-xs py-0.5 text-gray-500">Đã hủy</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const getPaymentBadge = (status) => {
    switch (status) {
      case 'PAID':
      case 'SUCCESS':
        return <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-bold">Đã thanh toán</span>;
      case 'UNPAID':
      case 'PENDING':
        return <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold">Chưa thanh toán</span>;
      case 'FAILED':
        return <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-bold">Thanh toán lỗi</span>;
      default:
        return <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  // Filter orders by active tab
  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'PENDING') return order.status === 'PENDING';
    if (activeTab === 'SHIPPING') return order.status === 'CONFIRMED' || order.status === 'SHIPPING';
    if (activeTab === 'COMPLETED') return order.status === 'COMPLETED';
    if (activeTab === 'CANCELLED') return order.status === 'CANCELLED';
    return true;
  });

  const tabCounts = {
    ALL: orders.length,
    PENDING: orders.filter((o) => o.status === 'PENDING').length,
    SHIPPING: orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'SHIPPING').length,
    COMPLETED: orders.filter((o) => o.status === 'COMPLETED').length,
    CANCELLED: orders.filter((o) => o.status === 'CANCELLED').length,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2.5">
            <Package className="text-blue-600" size={28} />
            Đơn Hàng Của Tôi
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Theo dõi tiến trình đơn hàng và lịch sử mua sắm sản phẩm tại BachBarber Salon
          </p>
        </div>
        <Button
          type="primary"
          onClick={() => navigate('/shop')}
          className="bg-[#1b2a4a] hover:bg-blue-900 font-bold rounded-xl text-xs h-10 px-5 flex items-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <ShoppingBag size={15} />
          Mua sắm sản phẩm
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-3 mb-6 scrollbar-hide border-b border-gray-100">
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'PENDING', label: 'Chờ xác nhận' },
          { key: 'SHIPPING', label: 'Đang giao' },
          { key: 'COMPLETED', label: 'Đã giao' },
          { key: 'CANCELLED', label: 'Đã hủy' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {tabCounts[tab.key] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Order List */}
      {loading ? (
        <div className="py-24 flex justify-center items-center">
          <Spin size="large" tip="Đang tải danh sách đơn hàng..." />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-xs border border-gray-100 flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
            <ShoppingBag size={28} />
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">Chưa có đơn hàng nào</h2>
          <p className="text-gray-500 text-xs max-w-sm mb-6">
            Bạn chưa có đơn hàng nào trong mục này. Hãy ghé qua cửa hàng để chọn những sản phẩm chăm sóc tóc tốt nhất!
          </p>
          <Button
            type="primary"
            onClick={() => navigate('/shop')}
            className="bg-[#1b2a4a] hover:bg-blue-900 font-bold h-10 px-6 rounded-xl text-xs"
          >
            Khám phá Cửa hàng
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map((order) => (
            <div
              key={order.orderId}
              className="bg-white rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-gray-50/70 px-5 py-3.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-gray-900 text-sm">{order.orderCode}</span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-500 flex items-center gap-1">
                    <Calendar size={13} className="text-gray-400" />
                    {formatDate(order.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getPaymentBadge(order.paymentStatus)}
                  {getStatusBadge(order.status)}
                </div>
              </div>

              {/* Order Items */}
              <div className="p-5 divide-y divide-gray-100">
                {order.items?.map((item) => (
                  <div key={item.orderDetailId} className="py-3 first:pt-0 last:pb-0 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                      <img
                        src={item.productImage || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop'}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-800 line-clamp-1">{item.productName}</h4>
                      <p className="text-xs text-gray-500 mt-1">Số lượng: x{item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">{formatPrice(item.totalPrice)}</div>
                      <div className="text-[11px] text-gray-400">{formatPrice(item.unitPrice)} / cái</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Details & Total Breakdown */}
              <div className="bg-gray-50/40 px-5 py-3.5 border-t border-gray-100 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-2 text-gray-600 max-w-lg">
                  <MapPin size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-gray-800">{order.receiverName} ({order.receiverPhone})</span>
                    <p className="text-gray-500 text-[11px] mt-0.5 leading-relaxed">{order.shippingAddress}</p>
                    {order.note && <p className="text-gray-400 text-[11px] italic mt-0.5">Ghi chú: {order.note}</p>}
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                  <div className="flex items-center gap-3 text-gray-500">
                    <span>Phí ship: <strong className="text-gray-700">{order.shippingFee > 0 ? formatPrice(order.shippingFee) : 'Miễn phí'}</strong></span>
                    <span>•</span>
                    <span>Phương thức: <strong className="text-gray-700">{order.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản VietQR' : order.paymentMethod === 'VNPAY' ? 'VNPay' : 'COD'}</strong></span>
                  </div>
                  <div className="text-base font-extrabold text-red-600 mt-1">
                    Tổng tiền: {formatPrice(order.finalAmount)}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3 bg-white border-t border-gray-100 flex items-center justify-end gap-2.5">
                {/* Repay VNPay button if Pending & VNPAY */}
                {order.status === 'PENDING' && order.paymentMethod === 'VNPAY' && !['PAID', 'SUCCESS'].includes(order.paymentStatus) && (
                  <Button
                    type="primary"
                    onClick={async () => {
                      message.loading("Đang kết nối cổng thanh toán VNPay...", 1.5);
                      try {
                        let url = order.vnpayUrl;
                        if (!url) {
                          url = await orderApi.getOrderVnPayUrl(order.orderId);
                        }
                        if (url) {
                          window.location.href = url;
                        } else {
                          message.error("Không thể tạo liên kết thanh toán VNPay!");
                        }
                      } catch (err) {
                        message.error("Lỗi kết nối cổng VNPay: " + (err.response?.data?.message || err.message));
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 font-bold rounded-xl text-xs h-9 flex items-center gap-1.5 border-none shadow-sm"
                  >
                    Thanh toán VNPay ngay
                    <ArrowRight size={13} />
                  </Button>
                )}

                {/* Repay VietQR button if Pending & Bank Transfer */}
                {order.status === 'PENDING' && order.paymentMethod === 'BANK_TRANSFER' && !['PAID', 'SUCCESS'].includes(order.paymentStatus) && (
                  <Button
                    type="primary"
                    icon={<QrCode size={14} />}
                    onClick={() => {
                      setSelectedOrderForPayment(order);
                      setQrModalVisible(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl text-xs h-9"
                  >
                    Thanh toán VietQR ngay
                  </Button>
                )}

                {/* Cancel button if Pending */}
                {order.status === 'PENDING' && (
                  <Popconfirm
                    title="Xác nhận hủy đơn hàng"
                    description="Bạn có chắc chắn muốn hủy đơn hàng này? Số lượng tồn kho sẽ được hoàn lại tự động."
                    onConfirm={() => handleCancelOrder(order.orderId || order.id)}
                    okText="Đồng ý hủy"
                    cancelText="Đóng"
                    okButtonProps={{ danger: true, loading: cancellingOrderId === (order.orderId || order.id) }}
                  >
                    <Button
                      danger
                      className="font-medium rounded-xl text-xs h-9"
                    >
                      Hủy đơn hàng
                    </Button>
                  </Popconfirm>
                )}

                <Button
                  onClick={() => navigate('/shop')}
                  className="font-medium rounded-xl text-xs h-9"
                >
                  Mua thêm
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VietQR Repay Modal */}
      <Modal
        open={qrModalVisible}
        footer={null}
        onCancel={() => {
          setQrModalVisible(false);
          setSelectedOrderForPayment(null);
        }}
        width={460}
        centered
      >
        {selectedOrderForPayment && selectedOrderForPayment.bankTransferDetails && (
          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-2 mb-1 text-blue-600">
              <QrCode size={22} />
              <h3 className="text-lg font-bold text-gray-900">Mã QR Thanh Toán</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Đơn hàng: <strong className="text-gray-900">{selectedOrderForPayment.orderCode}</strong>
            </p>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 inline-block shadow-inner mb-4">
              <img
                src={selectedOrderForPayment.bankTransferDetails.qrCodeUrl}
                alt="VietQR Code"
                className="w-52 h-52 object-contain mx-auto rounded-lg"
              />
            </div>

            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 text-left text-xs space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Ngân hàng:</span>
                <span className="font-bold text-gray-800">{selectedOrderForPayment.bankTransferDetails.bankName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Số tài khoản:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-blue-700">{selectedOrderForPayment.bankTransferDetails.accountNo}</span>
                  <button
                    onClick={() => copyToClipboard(selectedOrderForPayment.bankTransferDetails.accountNo, 'Số tài khoản')}
                    className="p-1 hover:bg-blue-100 rounded text-gray-600"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Số tiền:</span>
                <span className="font-bold text-red-600 text-sm">
                  {formatPrice(selectedOrderForPayment.finalAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-blue-200">
                <span className="text-gray-600 font-medium">Nội dung CK:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-extrabold text-blue-800 text-sm">
                    {selectedOrderForPayment.bankTransferDetails.transferContent}
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedOrderForPayment.bankTransferDetails.transferContent, 'Nội dung chuyển khoản')}
                    className="p-1 hover:bg-gray-100 rounded text-blue-700"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-blue-700 bg-blue-50 py-2 px-3 rounded-lg mb-4">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
              <span>Đang kết nối cổng thanh toán ngân hàng trực tiếp...</span>
            </div>

            <Button
              type="primary"
              onClick={() => {
                setQrModalVisible(false);
                setSelectedOrderForPayment(null);
                fetchOrders();
              }}
              className="w-full bg-[#1b2a4a] hover:bg-blue-900 font-bold rounded-xl text-xs h-10"
            >
              Đóng và Làm mới trạng thái
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
