import React, { useState } from 'react';
import { 
  Breadcrumb, 
  Select, 
  Rate, 
  Checkbox, 
  Input, 
  Button, 
  Modal, 
  Form,
  Drawer,
  Badge,
  message
} from 'antd';

const Footer = () => {
  return (
    <footer className="w-full bg-[#1b2a4a] text-white pt-12 pb-8 border-t border-gray-800">
      <div className="max-w-[1280px] mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h4 className="font-bold text-lg mb-4">CÔNG TY CỔ PHẦN TMDV 30SHINE</h4>
          <p className="text-sm text-gray-300 leading-relaxed mb-2">Số 148B Trương Định, Phường Tương Mai, TP Hà Nội</p>
          <p className="text-sm text-gray-300 leading-relaxed mb-2">Số giấy chứng nhận kinh doanh: 010.7467.693</p>
          <p className="text-sm text-gray-300 leading-relaxed mb-2">Ngày cấp: 08/06/2016</p>
          <p className="text-sm text-gray-300 leading-relaxed mb-4">Nơi cấp: Sở kế hoạch đầu tư TP Hà Nội</p>
          <div className="flex gap-4">
            <span className="bg-white/10 px-3 py-1 rounded text-xs font-semibold">ĐÃ THÔNG BÁO BỘ CÔNG THƯƠNG</span>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-lg mb-4">LIÊN KẾT</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="hover:text-white cursor-pointer">Giới thiệu</li>
            <li className="hover:text-white cursor-pointer">Fanpage</li>
            <li className="hover:text-white cursor-pointer">Liên hệ - Hỏi đáp</li>
            <li className="hover:text-white cursor-pointer">Chính sách bảo mật</li>
            <li className="hover:text-white cursor-pointer">Điều kiện giao dịch chung</li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-lg mb-4">HOTLINE ĐẶT HÀNG</h4>
          <button className="w-full bg-transparent border border-white text-white py-2 px-4 rounded-md flex items-center justify-center gap-2 hover:bg-white hover:text-[#244383] transition-colors font-bold text-lg">
             HOTLINE: 096.189.1914
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;