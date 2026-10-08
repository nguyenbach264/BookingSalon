import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Modal, message, Breadcrumb, Spin, Radio } from 'antd';
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectCartItems, clearCart } from "../../redux/cartSlice";
import { useAuth } from "../../auth/authProvider";
import orderApi from "../../service/api/orderApi";
import notificationWs from "../../service/websocket/notificationWebSocket";
import { CheckCircle2, Copy, QrCode, AlertCircle, ShoppingBag, ArrowRight } from 'lucide-react';

const VIETNAM_PROVINCES = [
  { value: 'Hà Nội', label: 'Hà Nội' },
  { value: 'TP. Hồ Chí Minh', label: 'TP. Hồ Chí Minh' },
  { value: 'Đà Nẵng', label: 'Đà Nẵng' },
  { value: 'Hải Phòng', label: 'Hải Phòng' },
  { value: 'Cần Thơ', label: 'Cần Thơ' },
  { value: 'Quảng Ninh', label: 'Quảng Ninh' },
  { value: 'Bình Dương', label: 'Bình Dương' },
  { value: 'Đồng Nai', label: 'Đồng Nai' },
  { value: 'Khánh Hòa', label: 'Khánh Hòa' },
  { value: 'Thừa Thiên Huế', label: 'Thừa Thiên Huế' },
];

const CheckoutPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { authenticated, userInfo, openLoginModal, checkCurrentSession } = useAuth();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('vnpay');
  const [submitting, setSubmitting] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const [countdown, setCountdown] = useState(900); // 15 minutes in seconds

  const cartItems = useSelector(selectCartItems);

  const subTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const shippingFee = subTotal >= 500000 || subTotal === 0 ? 0 : 30000;
  const total = subTotal + shippingFee;

  // Auto-fill user information into form if authenticated
  useEffect(() => {
    if (userInfo) {
      form.setFieldsValue({
        fullname: userInfo.fullName || userInfo.name || '',
        phone: userInfo.phoneNumber || userInfo.phone || '',
        email: userInfo.email || '',
        province: userInfo.city || 'Hà Nội',
        district: userInfo.district || 'Cầu Giấy',
        ward: userInfo.ward || 'Dịch Vọng',
        street: userInfo.address || '123 Phạm Văn Bạch',
      });
    }
  }, [userInfo, form]);

  // Connect WebSocket to listen for real-time bank payback events
  useEffect(() => {
    if (userInfo?.id) {
      notificationWs.connect({ userId: userInfo.id });
    }

    const unsubscribe = notificationWs.subscribe((payload) => {
      if (!payload) return;

      // Handle real-time bank payback callback event
      if (
        (payload.type === 'ORDER_PAID' || payload.type === 'ORDER_STATUS_CHANGED') &&
        createdOrder &&
        payload.orderCode === createdOrder.orderCode
      ) {
        setIsPaidSuccess(true);
        dispatch(clearCart());
        message.success(`Đã nhận được thanh toán cho đơn hàng ${payload.orderCode}!`);

        setTimeout(() => {
          setQrModalVisible(false);
          navigate('/my-orders'); 
        }, 2500);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [userInfo, createdOrder, dispatch, navigate]);

  // Countdown timer for VietQR Modal
  useEffect(() => {
    let timer = null;
    if (qrModalVisible && countdown > 0 && !isPaidSuccess) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [qrModalVisible, countdown, isPaidSuccess]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    message.success(`Đã sao chép ${label}!`);
  };

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinishFailed = ({ errorFields }) => {
    if (errorFields && errorFields.length > 0) {
      const firstError = errorFields[0].errors[0];
      message.error(`Vui lòng kiểm tra lại: ${firstError}`);
      form.scrollToField(errorFields[0].name[0], { behavior: 'smooth', block: 'center' });
    }
  };

  const handlePlaceOrder = async (values) => {
    // 1. Kiểm tra trạng thái đăng nhập
    if (!authenticated) {
      const isValid = typeof checkCurrentSession === 'function' ? await checkCurrentSession() : false;
      if (!isValid) {
        openLoginModal('Quý khách cần đăng nhập tài khoản để đặt hàng!', '/checkout');
        return;
      }
    }

    if (!cartItems || cartItems.length === 0) {
      message.error("Giỏ hàng của bạn đang trống!");
      return;
    }

    setSubmitting(true);

    try {
      // Production Concurrency & Idempotency: Unique Key per submission
      const idempotencyKey = `order-${userInfo?.id || 'guest'}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      const fullAddress = [
        values.street,
        values.ward,
        values.district,
        values.province
      ].filter(Boolean).join(', ');

      // Map form value → API PaymentMethod
      const paymentChoice = selectedPaymentMethod || values.paymentMethod || 'vnpay';
      let apiPaymentMethod = 'COD';
      if (paymentChoice === 'vnpay') apiPaymentMethod = 'VNPAY';
      else if (paymentChoice === 'banking') apiPaymentMethod = 'BANK_TRANSFER';

      const orderPayload = {
        userId: userInfo?.id,
        receiverName: values.fullname?.trim(),
        receiverPhone: values.phone?.trim(),
        shippingAddress: fullAddress,
        note: values.note ? values.note.trim() : '',
        paymentMethod: apiPaymentMethod,
        items: cartItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      };

      const orderResponse = await orderApi.createOrder(orderPayload, idempotencyKey);
      console.log("Order created successfully:", orderResponse);
      setCreatedOrder(orderResponse); 

      if (paymentChoice === 'vnpay') {
        let redirectUrl = orderResponse.vnpayUrl;
        if (!redirectUrl) {
          try {
            redirectUrl = await orderApi.getOrderVnPayUrl(orderResponse.orderId || orderResponse.id);
          } catch (e) {
            console.warn("Could not get VNPay URL fallback", e);
          }
        }

        if (redirectUrl) {
          message.loading('Đang chuyển hướng đến cổng thanh toán VNPay...', 2);
          dispatch(clearCart());
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 1200);
        } else {
          message.success("Đặt hàng thành công! Mã đơn: " + orderResponse.orderCode);
          dispatch(clearCart());
          navigate("/my-orders");
        }
      } else if (paymentChoice === 'banking') {
        // Show VietQR Modal for Bank Transfer
        setCountdown(900);
        setIsPaidSuccess(false);
        setQrModalVisible(true);
      } else {
        // COD order completed
        message.success("Đặt hàng thành công! Mã đơn: " + orderResponse.orderCode);
        dispatch(clearCart());
        navigate("/my-orders");
      }
    } catch (err) {
      console.error("Order creation failed:", err);
      const errorMsg = err.response?.data?.message || err.message || "Đặt hàng thất bại. Vui lòng thử lại!";
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0 && !createdOrder) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[60vh] bg-gray-50 flex-1 w-full">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm mb-4">
          <ShoppingBag size={36} />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Không có sản phẩm nào để thanh toán</h2>
        <p className="text-gray-500 mb-6 text-sm">Vui lòng quay lại cửa hàng để thêm sản phẩm vào giỏ.</p>
        <Button
          type="primary"
          onClick={() => navigate("/shop")}
          className="bg-[#1b2a4a] hover:bg-blue-900 h-11 px-8 rounded-lg font-bold text-sm"
        >
          Tiếp tục mua sắm
        </Button>
      </div>
    );
  }

  const bankDetails = createdOrder?.bankTransferDetails;

  return (
    <div className="w-full flex-1 flex flex-col bg-gray-50">
      <div className="w-full bg-white py-3 border-b border-gray-200">
        <div className="max-w-[1280px] mx-auto px-4">
          <Breadcrumb
            items={[
              { title: <span onClick={() => navigate("/shop")} className="text-gray-500 cursor-pointer hover:text-blue-600 transition-colors">Cửa hàng</span> },
              { title: <span className="text-gray-900 font-medium">Thanh toán</span> }
            ]}
          />
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 py-8 w-full flex-1">
        <h1 className="text-2xl font-black uppercase mb-6 text-gray-900 tracking-tight">Thanh toán đơn hàng</h1>
        
        <Form 
          form={form}
          layout="vertical" 
          onFinish={handlePlaceOrder}
          onFinishFailed={handleFinishFailed}
          initialValues={{ paymentMethod: 'vnpay', province: 'Hà Nội' }}
          className="flex flex-col lg:flex-row gap-8 items-start"
        >
          {/* Cột trái: Thông tin nhận hàng & Thanh toán */}
          <div className="flex-1 w-full space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-5">
                1. Thông tin giao hàng
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                <Form.Item
                  label="Họ và tên người nhận"
                  name="fullname"
                  rules={[{ required: true, message: 'Vui lòng nhập họ tên người nhận!' }]}
                >
                  <Input placeholder="Ví dụ: Nguyễn Văn A" size="large" className="rounded-xl" />
                </Form.Item>

                <Form.Item
                  label="Số điện thoại"
                  name="phone"
                  rules={[
                    { required: true, message: 'Vui lòng nhập số điện thoại!' },
                    {
                      validator(_, value) {
                        if (!value) return Promise.resolve();
                        const cleaned = String(value).replace(/[\s\-\(\)\.]/g, '');
                        if (/^(0|\+?84)[0-9]{8,10}$/.test(cleaned) || /^[0-9]{9,11}$/.test(cleaned)) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Số điện thoại không hợp lệ (Ví dụ: 0912345678)!'));
                      },
                    },
                  ]}
                >
                  <Input placeholder="Ví dụ: 0912345678" size="large" className="rounded-xl" />
                </Form.Item>
              </div>

              <Form.Item
                label="Địa chỉ email (nhận thông báo cập nhật)"
                name="email"
                rules={[{ type: 'email', message: 'Email không hợp lệ!' }]}
              >
                <Input placeholder="email@example.com" size="large" className="rounded-xl" />
              </Form.Item>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Form.Item
                  label="Tỉnh / Thành phố"
                  name="province"
                  rules={[{ required: true, message: 'Vui lòng chọn Tỉnh/Thành!' }]}
                >
                  <Select
                    options={VIETNAM_PROVINCES}
                    placeholder="Chọn Tỉnh/Thành"
                    size="large"
                    className="rounded-xl"
                  />
                </Form.Item>

                <Form.Item
                  label="Quận / Huyện"
                  name="district"
                  rules={[{ required: true, message: 'Vui lòng nhập Quận/Huyện!' }]}
                >
                  <Input placeholder="Ví dụ: Quận Cầu Giấy" size="large" className="rounded-xl" />
                </Form.Item>

                <Form.Item
                  label="Phường / Xã"
                  name="ward"
                  rules={[{ required: true, message: 'Vui lòng nhập Phường/Xã!' }]}
                >
                  <Input placeholder="Ví dụ: Phường Dịch Vọng" size="large" className="rounded-xl" />
                </Form.Item>
              </div>

              <Form.Item
                label="Địa chỉ chi tiết (Số nhà, tên đường, tòa nhà...)"
                name="street"
                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ nhận hàng chi tiết!' }]}
              >
                <Input.TextArea placeholder="Ví dụ: Tòa nhà FPT, Số 10 Phạm Văn Bạch..." rows={2} className="rounded-xl" />
              </Form.Item>

              <Form.Item label="Ghi chú đơn hàng (nếu có)" name="note" className="mb-0">
                <Input.TextArea placeholder="Ghi chú về thời gian giao hàng, lời nhắn cho shipper..." rows={2} className="rounded-xl" />
              </Form.Item>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-5">
                2. Phương thức thanh toán
              </h2>

              <Form.Item name="paymentMethod" className="mb-0">
                <Radio.Group
                  value={selectedPaymentMethod}
                  onChange={(e) => {
                    setSelectedPaymentMethod(e.target.value);
                    form.setFieldValue('paymentMethod', e.target.value);
                  }}
                  className="w-full space-y-3 flex flex-col"
                >
                  {/* VNPay — Recommended */}
                  <div
                    onClick={() => {
                      setSelectedPaymentMethod('vnpay');
                      form.setFieldValue('paymentMethod', 'vnpay');
                    }}
                    className={`p-4 border rounded-xl transition-all cursor-pointer flex items-center gap-3 ${
                      selectedPaymentMethod === 'vnpay'
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-600'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <Radio value="vnpay" checked={selectedPaymentMethod === 'vnpay'} />
                    <div className="flex items-center justify-between flex-1 gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">Thanh toán qua VNPay</span>
                          <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Khuyên dùng</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Thanh toán an toàn qua cổng VNPay — ATM, thẻ Visa/Master, QR Banking, ví điện tử. Xác nhận tức thì.
                        </div>
                      </div>
                      <img src="https://vnpay.vn/s1/statics/img/logo2-QkCiDMRl.png" alt="VNPay" className="h-7 object-contain" onError={e => e.target.style.display='none'} />
                    </div>
                  </div>

                  {/* VietQR Bank Transfer */}
                  <div
                    onClick={() => {
                      setSelectedPaymentMethod('banking');
                      form.setFieldValue('paymentMethod', 'banking');
                    }}
                    className={`p-4 border rounded-xl transition-all cursor-pointer flex items-center gap-3 ${
                      selectedPaymentMethod === 'banking'
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-600'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <Radio value="banking" checked={selectedPaymentMethod === 'banking'} />
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 text-sm">Chuyển khoản VietQR (Thủ công)</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Quét mã VietQR qua app ngân hàng. Hệ thống tự xác nhận sau khi ngân hàng báo có tiền.
                      </div>
                    </div>
                  </div>

                  {/* COD */}
                  <div
                    onClick={() => {
                      setSelectedPaymentMethod('cod');
                      form.setFieldValue('paymentMethod', 'cod');
                    }}
                    className={`p-4 border rounded-xl transition-all cursor-pointer flex items-center gap-3 ${
                      selectedPaymentMethod === 'cod'
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-600'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <Radio value="cod" checked={selectedPaymentMethod === 'cod'} />
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 text-sm">Thanh toán khi nhận hàng (COD)</div>
                      <div className="text-xs text-gray-500 mt-1">Khách hàng thanh toán tiền mặt trực tiếp cho nhân viên giao hàng</div>
                    </div>
                  </div>
                </Radio.Group>
              </Form.Item>
            </div>
          </div>

          {/* Cột phải: Tóm tắt đơn hàng */}
          <div className="w-full lg:w-[420px] lg:sticky lg:top-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
              <span>Đơn hàng của bạn</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-semibold">
                {cartItems.length} sản phẩm
              </span>
            </h2>

            <div className="max-h-[320px] overflow-y-auto pr-1 space-y-3 mb-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-3 items-center py-1">
                  <div className="w-14 h-14 bg-gray-50 rounded-lg border border-gray-100 flex-shrink-0 overflow-hidden">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-gray-800 truncate" title={item.name}>{item.name}</h4>
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span className="text-gray-500">SL: x{item.quantity}</span>
                      <span className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2.5 mb-6 text-xs">
              <div className="flex justify-between items-center text-gray-600">
                <span>Tạm tính hàng hóa:</span>
                <span className="font-semibold text-gray-800">{formatPrice(subTotal)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Phí vận chuyển toàn quốc:</span>
                <span className={`font-semibold ${shippingFee === 0 ? 'text-green-600' : 'text-gray-800'}`}>
                  {shippingFee === 0 ? 'MIỄN PHÍ' : formatPrice(shippingFee)}
                </span>
              </div>
              {shippingFee === 0 && subTotal > 0 && (
                <p className="text-[11px] text-green-600 bg-green-50 p-1.5 rounded-lg text-center font-medium">
                  🎉 Đơn hàng trên 500.000đ được miễn phí vận chuyển!
                </p>
              )}
              <div className="flex justify-between items-center border-t border-dashed border-gray-200 pt-3">
                <span className="text-sm font-bold text-gray-900">Tổng thanh toán:</span>
                <span className="text-2xl font-black text-red-600">{formatPrice(total)}</span>
              </div>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              className="w-full h-12 bg-red-600 hover:bg-red-700 font-bold text-sm rounded-xl shadow-md border-none uppercase tracking-wider transition-all"
            >
              {submitting ? "Đang xử lý đơn hàng..." : "ĐẶT HÀNG NGAY"}
            </Button>
            <p className="text-center text-[11px] text-gray-400 mt-3 leading-normal">
              Nhấn đặt hàng đồng nghĩa với việc bạn đồng ý với Điều khoản mua sắm tại BachBarber Salon
            </p>
          </div>
        </Form>
      </div>

      {/* VietQR Payment Modal */}
      <Modal
        open={qrModalVisible}
        footer={null}
        closable={!isPaidSuccess}
        onCancel={() => {
          if (!isPaidSuccess) {
            setQrModalVisible(false);
            dispatch(clearCart());
            navigate("/my-orders");
          }
        }}
        width={480}
        centered
        className="vietqr-modal"
      >
        <div className="py-2 text-center">
          {isPaidSuccess ? (
            <div className="py-8 flex flex-col items-center animate-fade-in">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-xl font-bold text-green-700 mb-2">Thanh toán thành công!</h2>
              <p className="text-gray-600 text-sm mb-4">
                Hệ thống ngân hàng đã xác nhận thanh toán cho đơn hàng <strong className="text-gray-900">{createdOrder?.orderCode}</strong>.
              </p>
              <div className="text-xs text-gray-500">Đang chuyển hướng về trang đơn hàng của bạn...</div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-center gap-2 mb-2 text-blue-600">
                <QrCode size={24} />
                <h3 className="text-lg font-bold text-gray-900">Quét mã VietQR để thanh toán</h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Mở ứng dụng ngân hàng hoặc ví điện tử để quét mã QR bên dưới:
              </p>

              {/* VietQR Image Container */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 inline-block shadow-inner mb-4 relative">
                {bankDetails?.qrCodeUrl ? (
                  <img
                    src={bankDetails.qrCodeUrl}
                    alt="VietQR Payment Code"
                    className="w-56 h-56 object-contain mx-auto rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center">
                    <Spin tip="Đang tạo mã QR..." />
                  </div>
                )}
                <div className="mt-2 text-xs font-mono font-semibold text-gray-700">
                  Thời gian giữ đơn: <span className="text-red-600 font-bold">{formatCountdown(countdown)}</span>
                </div>
              </div>

              {/* Bank Transfer Details with Copy Buttons */}
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 text-left text-xs space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Ngân hàng:</span>
                  <span className="font-bold text-gray-800">{bankDetails?.bankName || 'MB Bank'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Số tài khoản:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-blue-700">{bankDetails?.accountNo}</span>
                    <button
                      onClick={() => copyToClipboard(bankDetails?.accountNo, 'Số tài khoản')}
                      className="p-1 hover:bg-blue-100 rounded text-gray-600"
                      title="Sao chép"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Chủ tài khoản:</span>
                  <span className="font-bold text-gray-800">{bankDetails?.accountName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Số tiền:</span>
                  <span className="font-bold text-red-600 text-sm">
                    {formatPrice(bankDetails?.amount || total)}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-blue-200">
                  <span className="text-gray-600 font-medium">Nội dung CK:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-extrabold text-blue-800 text-sm tracking-wider">
                      {bankDetails?.transferContent || createdOrder?.orderCode}
                    </span>
                    <button
                      onClick={() => copyToClipboard(bankDetails?.transferContent || createdOrder?.orderCode, 'Nội dung chuyển khoản')}
                      className="p-1 hover:bg-gray-100 rounded text-blue-700"
                      title="Sao chép"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Pulsing Status Banner */}
              <div className="flex items-center justify-center gap-2 text-xs text-blue-700 bg-blue-50 py-2 px-3 rounded-lg mb-4">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                <span>Hệ thống tự động kích hoạt ngay khi ngân hàng báo có tiền</span>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setQrModalVisible(false);
                    dispatch(clearCart());
                    navigate("/my-orders");
                  }}
                  className="flex-1 font-semibold rounded-xl text-xs h-10"
                >
                  Tôi sẽ chuyển khoản sau
                </Button>
                <Button
                  type="primary"
                  onClick={() => {
                    setQrModalVisible(false);
                    dispatch(clearCart());
                    navigate("/my-orders");
                  }}
                  className="flex-1 bg-[#1b2a4a] hover:bg-blue-900 font-bold rounded-xl text-xs h-10 flex items-center justify-center gap-1.5"
                >
                  Xem đơn hàng
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default CheckoutPage;
