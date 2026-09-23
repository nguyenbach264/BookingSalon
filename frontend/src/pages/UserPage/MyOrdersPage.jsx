import React from 'react';
import { Button, Empty } from 'antd';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MyOrdersPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 flex flex-col items-center">
        <div className="w-16 h-16 bg-blue-50 text-[#60a5fa] rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100">
          <ShoppingBag size={28} />
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-2">Đơn Hàng Đã Đặt</h1>
        <p className="text-gray-500 text-sm max-w-md mb-8 leading-relaxed">
          Hiện tại bạn chưa có đơn hàng mua sắm sản phẩm nào. Hệ thống sản phẩm và phụ kiện chăm sóc tóc độc quyền đang được mở rộng và cập nhật liên tục!
        </p>

        <div className="flex items-center gap-4">
          <Button
            type="primary"
            onClick={() => navigate('/shop')}
            className="bg-[#60a5fa] hover:bg-blue-500 font-bold h-11 px-6 rounded-xl text-xs shadow-md flex items-center gap-2"
          >
            Khám phá Shop ngay
            <ArrowRight size={14} />
          </Button>
          <Button
            onClick={() => navigate('/booking')}
            className="font-semibold h-11 px-6 rounded-xl text-xs"
          >
            Đặt lịch làm tóc
          </Button>
        </div>
      </div>
    </div>
  );
}

