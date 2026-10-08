import React, { useState, useEffect } from 'react';
import { Rate, InputNumber } from 'antd';

const PRICE_PRESETS = [
  { label: 'Tất cả mức giá', min: undefined, max: undefined },
  { label: 'Dưới 200.000đ', min: 0, max: 200000 },
  { label: '200.000đ - 500.000đ', min: 200000, max: 500000 },
  { label: '500.000đ - 1.000.000đ', min: 500000, max: 1000000 },
  { label: 'Trên 1.000.000đ', min: 1000000, max: undefined },
];

const FilterSidebar = ({ filters = {}, onFilterChange, onReset }) => {
  const [minPrice, setMinPrice] = useState(filters.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice || '');

  // Sync internal state when external filters reset
  useEffect(() => {
    setMinPrice(filters.minPrice ?? '');
    setMaxPrice(filters.maxPrice ?? '');
  }, [filters.minPrice, filters.maxPrice]);

  // Handle preset click
  const handlePresetSelect = (preset) => {
    setMinPrice(preset.min ?? '');
    setMaxPrice(preset.max ?? '');
    onFilterChange?.({
      ...filters,
      minPrice: preset.min,
      maxPrice: preset.max,
    });
  };

  // Handle rating click
  const handleRatingClick = (stars) => {
    const newRating = filters.minRating === stars ? undefined : stars;
    onFilterChange?.({
      ...filters,
      minRating: newRating,
    });
  };

  // Handle custom price change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const numMin = minPrice !== '' && !isNaN(minPrice) ? Number(minPrice) : undefined;
      const numMax = maxPrice !== '' && !isNaN(maxPrice) ? Number(maxPrice) : undefined;

      if (numMin !== filters.minPrice || numMax !== filters.maxPrice) {
        onFilterChange?.({
          ...filters,
          minPrice: numMin,
          maxPrice: numMax,
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [minPrice, maxPrice]);

  return (
    <div className="w-full md:w-72 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
        <h3 className="font-bold text-gray-900 text-base">Bộ Lọc Tìm Kiếm</h3>
        {(filters.minPrice || filters.maxPrice || filters.minRating || filters.categoryId || filters.search) && (
          <button
            onClick={onReset}
            className="text-xs text-red-600 hover:text-red-700 font-semibold transition-colors"
          >
            Xóa lọc
          </button>
        )}
      </div>

      {/* Khoảng giá */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-800 text-sm mb-3">Khoảng Giá (VNĐ)</h4>
        
        {/* Preset tags */}
        <div className="space-y-1.5 mb-3">
          {PRICE_PRESETS.map((preset, idx) => {
            const isSelected =
              filters.minPrice === preset.min &&
              filters.maxPrice === preset.max;
            return (
              <div
                key={idx}
                onClick={() => handlePresetSelect(preset)}
                className={`text-xs px-3 py-2 rounded-lg cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200 shadow-xs'
                    : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                }`}
              >
                <span>{preset.label}</span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                )}
              </div>
            );
          })}
        </div>

        {/* Tùy chỉnh giá */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Hoặc nhập khoảng giá tự chọn:</p>
          <div className="flex items-center gap-2">
            <InputNumber
              placeholder="Từ"
              value={minPrice}
              onChange={(val) => setMinPrice(val)}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              className="w-full text-xs rounded-lg"
              min={0}
            />
            <span className="text-gray-400 font-medium">-</span>
            <InputNumber
              placeholder="Đến"
              value={maxPrice}
              onChange={(val) => setMaxPrice(val)}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              className="w-full text-xs rounded-lg"
              min={0}
            />
          </div>
        </div>
      </div>

      {/* Đánh giá */}
      <div className="mb-6 pb-4 border-b border-gray-100">
        <h4 className="font-semibold text-gray-800 text-sm mb-3">Đánh Giá Sản Phẩm</h4>
        <div className="space-y-2">
          {[5, 4, 3].map((stars) => {
            const isSelected = filters.minRating === stars;
            return (
              <div
                key={stars}
                onClick={() => handleRatingClick(stars)}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Rate disabled defaultValue={stars} className="text-xs text-yellow-400" />
                  <span className={`text-xs ${isSelected ? 'text-blue-700 font-semibold' : 'text-gray-600'}`}>
                    {stars === 5 ? '5 sao' : `Từ ${stars} sao`}
                  </span>
                </div>
                {isSelected && (
                  <span className="text-xs text-blue-600 font-bold">✓</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={onReset}
        className="w-full border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 py-2.5 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Đặt lại toàn bộ lọc
      </button>
    </div>
  );
};

export default FilterSidebar;
