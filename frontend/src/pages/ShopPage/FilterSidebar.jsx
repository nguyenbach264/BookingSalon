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

const FilterSidebar = () => {
  return (
    <div className="w-full md:w-72 bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
      <h3 className="font-bold text-gray-900 text-base mb-4 pb-2 border-b border-gray-100">Khoảng Giá</h3>
      <div className="flex items-center gap-2 mb-4">
        <Input placeholder="Từ" className="text-center text-sm" />
        <span className="text-gray-400">-</span>
        <Input placeholder="Đến" className="text-center text-sm" />
      </div>
      <button className="w-full border border-gray-300 text-gray-700 py-1.5 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors mb-6">
        Áp dụng
      </button>

      <h3 className="font-bold text-gray-900 text-base mb-3 pb-2 border-b border-gray-100">Đánh Giá</h3>
      <div className="space-y-2 mb-6">
        {[5, 4, 3, 2, 1].map((stars) => (
          <div key={stars} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
            <Rate disabled defaultValue={stars} className="text-xs" />
            <span className="text-sm text-gray-600">{stars === 5 ? '5 sao' : `${stars} sao trở lên`}</span>
          </div>
        ))}
      </div>

      <h3 className="font-bold text-gray-900 text-base mb-3 pb-2 border-b border-gray-100">Thương Hiệu</h3>
      <div className="mb-4">
        <Input placeholder="Tìm thương hiệu..." className="text-sm" />
      </div>
      <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
        {['PHARMA BIO LABORATORY', 'DR.FORSKIN', 'GLANZEN', 'L\'ORSIA', 'MOROCCANOIL'].map((brand) => (
          <label key={brand} className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer">
            <Checkbox />
            <span className="truncate">{brand}</span>
          </label>
        ))}
      </div>
      <div className="mt-3 text-blue-600 text-sm font-medium cursor-pointer hover:underline">
        Xem thêm
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button className="w-full border border-red-500 text-red-600 hover:bg-red-50 py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2">
          Bỏ tất cả lọc
        </button>
      </div>
    </div>
  );
};

export default FilterSidebar;

