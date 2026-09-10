import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, message, Breadcrumb } from 'antd';

import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectCartItems, clearCart } from "../../redux/cartSlice";

const MOCK_PROVINCES = [
  { value: 'hanoi', label: 'Hà Nội' },
  { value: 'hochiminh', label: 'Hồ Chí Minh' },
  { value: 'danang', label: 'Đà Nẵng' }
];

const MOCK_DISTRICTS = {
  hanoi: [
    { value: 'dongda', label: 'Quận Đống Đa' },
    { value: 'caugiay', label: 'Quận Cầu Giấy' },
  ],
  hochiminh: [
    { value: 'quan1', label: 'Quận 1' },
    { value: 'quan3', label: 'Quận 3' },
  ],
  danang: [
    { value: 'haichau', label: 'Quận Hải Châu' }
  ]
};

const MOCK_WARDS = {
  dongda: [
    { value: 'langha', label: 'Phường Láng Hạ' },
    { value: 'ochodua', label: 'Phường Ô Chợ Dừa' },
    { value: 'trungliet', label: 'Phường Trung Liệt' },
  ],
  caugiay: [
    { value: 'dichvong', label: 'Phường Dịch Vọng' },
    { value: 'maidich', label: 'Phường Mai Dịch' },
  ],
  quan1: [
    { value: 'bennghe', label: 'Phường Bến Nghé' },
    { value: 'benthanh', label: 'Phường Bến Thành' },
  ],
  quan3: [
    { value: 'vothisau', label: 'Phường Võ Thị Sáu' },
  ],
  haichau: [
    { value: 'haichau1', label: 'Phường Hải Châu I' },
    { value: 'thachthang', label: 'Phường Thạch Thang' },
  ]
};

const CheckoutPage = () => {
  const [form] = Form.useForm(); 

  const navigate = useNavigate(); 
  const dispatch = useDispatch(); 

  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  const cartItems = useSelector(selectCartItems);

  const subTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const shippingFee = subTotal > 0 ? 30000 : 0; // Phí ship giả lập 30k
  const total = subTotal + shippingFee;

  const handleProvinceChange = (value) => {
    setSelectedProvince(value);
    setSelectedDistrict(null); // Reset huyện đang chọn
    form.setFieldsValue({ district: undefined, ward: undefined }); // Xóa dữ liệu cũ trong form
  };

  const handleDistrictChange = (value) => {
    setSelectedDistrict(value);
    form.setFieldsValue({ ward: undefined }); // Xóa dữ liệu xã cũ trong form
  };

  const handleGoBack = () => {
    navigate("/shop");
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handlePlaceOrder = () => {
    message.success("Đặt hàng thành công! Cảm ơn bạn đã mua sắm tại 30Shine.");
    dispatch(clearCart()); 
    navigate("/shop"); 
  };

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[60vh] bg-gray-50 flex-1 w-full">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Không có sản phẩm nào để thanh toán</h2>
        <p className="text-gray-500 mb-6">Vui lòng quay lại cửa hàng để thêm sản phẩm vào giỏ.</p>
        <Button type="primary" onClick={handleGoBack} className="bg-[#1b2a4a] h-11 px-8 rounded-lg font-bold">
          Tiếp tục mua sắm
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col bg-gray-50">
      <div className="w-full bg-white py-3 border-b border-gray-200">
        <div className="max-w-[1280px] mx-auto px-4">
          <Breadcrumb
            items={[
              { title: <span onClick={handleGoBack} className="text-gray-500 cursor-pointer hover:text-blue-600 transition-colors">Trang chủ</span> },
              { title: <span onClick={handleGoBack} className="text-gray-500 cursor-pointer hover:text-blue-600 transition-colors">Giỏ hàng</span> },
              { title: <span className="text-gray-900 font-medium">Thanh toán</span> }
            ]}
          />
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 py-8 w-full flex-1">
        <h1 className="text-2xl font-bold uppercase mb-6 text-gray-900">Thanh toán đơn hàng</h1>

        <Form
          form={form}
          layout="vertical"
          onFinish={handlePlaceOrder}
          initialValues={{ paymentMethod: 'cod' }}
          className="flex flex-col lg:flex-row gap-8 items-start"
        >
          {/* Cột trái: Thông tin & Phương thức thanh toán */}
          <div className="flex-1 w-full space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-5">1. Thông tin giao hàng</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                <Form.Item
                  label="Họ và tên người nhận"
                  name="fullname"
                  rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                >
                  <Input placeholder="Ví dụ: Nguyễn Văn A" size="large" className="rounded-lg" />
                </Form.Item>

                <Form.Item
                  label="Số điện thoại"
                  name="phone"
                  rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
                >
                  <Input placeholder="Nhập số điện thoại liên hệ" size="large" className="rounded-lg" />
                </Form.Item>
              </div>

              <Form.Item
                label="Địa chỉ email (không bắt buộc)"
                name="email"
                rules={[{ type: 'email', message: 'Email không hợp lệ!' }]}
              >
                <Input placeholder="Để nhận thông tin cập nhật đơn hàng" size="large" className="rounded-lg" />
              </Form.Item>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Form.Item
                  label="Tỉnh/Thành phố"
                  name="province"
                  rules={[{ required: true, message: 'Vui lòng chọn Tỉnh/Thành!' }]}
                  className="mb-0"
                >
                  <Select
                    options={MOCK_PROVINCES}
                    placeholder="Chọn Tỉnh/Thành"
                    size="large"
                    onChange={handleProvinceChange}
                  />
                </Form.Item>

                <Form.Item
                  label="Quận/Huyện"
                  name="district"
                  rules={[{ required: true, message: 'Vui lòng chọn Quận/Huyện!' }]}
                  className="mb-0"
                >
                  <Select
                    options={selectedProvince ? MOCK_DISTRICTS[selectedProvince] : []}
                    placeholder="Chọn Quận/Huyện"
                    size="large"
                    disabled={!selectedProvince}
                    onChange={handleDistrictChange}
                  />
                </Form.Item>

                <Form.Item
                  label="Phường/Xã"
                  name="ward"
                  rules={[{ required: true, message: 'Vui lòng chọn Phường/Xã!' }]}
                  className="mb-0"
                >
                  <Select
                    options={selectedDistrict ? MOCK_WARDS[selectedDistrict] : []}
                    placeholder="Chọn Phường/Xã"
                    size="large"
                    disabled={!selectedDistrict}
                  />
                </Form.Item>
              </div>

              <Form.Item
                label="Địa chỉ chi tiết (Số nhà, Tên đường...)"
                name="street"
                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ nhận hàng chi tiết!' }]}
              >
                <Input.TextArea placeholder="Ví dụ: Số 148B Trương Định..." rows={2} className="rounded-lg" />
              </Form.Item>

              <Form.Item label="Ghi chú đơn hàng" name="note" className="mb-0">
                <Input.TextArea placeholder="Ghi chú thêm về thời gian nhận hàng, chỉ dẫn địa điểm..." rows={2} className="rounded-lg" />
              </Form.Item>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-5">2. Phương thức thanh toán</h2>

              <Form.Item name="paymentMethod" className="mb-0">
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                    <input type="radio" name="paymentMethod" value="cod" className="w-4 h-4 text-blue-600 focus:ring-blue-500" defaultChecked />
                    <div>
                      <div className="font-medium text-gray-800">Thanh toán khi nhận hàng (COD)</div>
                      <div className="text-sm text-gray-500 mt-0.5">Khách hàng thanh toán bằng tiền mặt khi nhận hàng</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                    <input type="radio" name="paymentMethod" value="banking" className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                    <div>
                      <div className="font-medium text-gray-800">Chuyển khoản qua thẻ ngân hàng</div>
                      <div className="text-sm text-gray-500 mt-0.5">Vietcombank, Techcombank, MB Bank,...</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                    <input type="radio" name="paymentMethod" value="momo" className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                    <div>
                      <div className="font-medium text-gray-800">Thanh toán qua Ví điện tử</div>
                      <div className="text-sm text-gray-500 mt-0.5">Momo, ZaloPay, VNPay</div>
                    </div>
                  </label>
                </div>
              </Form.Item>
            </div>
          </div>

          {/* Cột phải: Tóm tắt đơn hàng */}
          <div className="w-full lg:w-[400px] lg:sticky lg:top-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4">Đơn hàng của bạn ({cartItems.length} sản phẩm)</h2>

            <div className="max-h-[350px] overflow-y-auto pr-2 space-y-4 mb-4">
              {cartItems.map(item => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-50 rounded border border-gray-100 flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="text-sm font-medium text-gray-800 line-clamp-2">{item.name}</h4>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">Số lượng: {item.quantity}</span>
                      <span className="text-sm font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Tạm tính:</span>
                <span className="font-medium text-gray-900">{formatPrice(subTotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Phí vận chuyển:</span>
                <span className="font-medium text-gray-900">{formatPrice(shippingFee)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-dashed border-gray-200 pt-3">
                <span className="text-base font-bold text-gray-800">Tổng thanh toán:</span>
                <span className="text-2xl font-black text-red-600">{formatPrice(total)}</span>
              </div>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              className="w-full h-12 bg-red-600 hover:bg-red-700 font-bold text-base rounded-lg shadow-md border-none uppercase tracking-wider"
            >
              ĐẶT HÀNG NGAY
            </Button>
            <p className="text-center text-xs text-gray-400 mt-3">Nhấn đặt hàng đồng nghĩa với việc bạn đồng ý với Điều khoản của 30Shine Shop</p>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default CheckoutPage;