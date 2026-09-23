import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Scissors,
  ShoppingBag,
  MapPin,
  Gift,
  Star,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Modal, Tag } from 'antd';
import { getSalons } from '../../service/api/salonApi';
import { useAuth } from '../../auth/authProvider';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticated, openLoginModal } = useAuth();

  const [salonsModalOpen, setSalonsModalOpen] = useState(false);
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [salons, setSalons] = useState([]);
  const [loadingSalons, setLoadingSalons] = useState(false);

  useEffect(() => {
    getSalons()
      .then((data) => setSalons(Array.isArray(data) ? data : []))
      .catch(() => setSalons([]));
  }, []);

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    {
      key: 'service',
      label: 'BẢNG GIÁ DỊCH VỤ',
      path: '/service',
      icon: <Scissors size={15} />,
    },
    {
      key: 'shop',
      label: 'CỬA HÀNG SẢN PHẨM',
      path: '/shop',
      icon: <ShoppingBag size={15} />,
    },
    {
      key: 'salons',
      label: 'HỆ THỐNG SALON',
      onClick: () => setSalonsModalOpen(true),
      icon: <MapPin size={15} />,
    },
    {
      key: 'promotions',
      label: 'ƯU ĐÃI & VOUCHER',
      onClick: () => setPromoModalOpen(true),
      icon: <Gift size={15} />,
      badge: 'HOT',
    },
    {
      key: 'reviews',
      label: 'ĐÁNH GIÁ KHÁCH HÀNG',
      onClick: () => {
        if (location.pathname !== '/') {
          navigate('/#reviews');
        } else {
          document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
        }
      },
      icon: <Star size={15} />,
    },
  ];

  return (
    <>
      <nav className="w-full bg-white text-white select-none border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-4 flex items-center">
          {/* Main Navigation Links (24h style) */}
          <div className="flex justify-start md:justify-between items-center overflow-x-auto scrollbar-none w-full gap-1 sm:gap-2">
            {/* Home Icon Button (24h signature) */}
            <button
              type="button"
              onClick={() => navigate('/')}
              aria-label="Trang chủ"
              className="flex items-center justify-center px-3 sm:px-4 pt-3 pb-2 shrink-0 cursor-pointer"
            >
              <Home
                size={26}
                className={`drop-shadow-sm py-0.5 border-b-2 transition-colors duration-300 ${
                  isActive('/') ? 'border-[#60a5fa] text-[#60a5fa]' : 'border-transparent text-gray-700 hover:border-[#60a5fa] hover:text-[#60a5fa]'
                }`}
              />
            </button>

            {/* Category Items */}
            {navItems.map((item) => {
              const active = item.path ? isActive(item.path) : false;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    if (item.onClick) item.onClick();
                    else if (item.path) navigate(item.path);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 pt-3 pb-2 text-xs md:text-sm font-bold tracking-wide whitespace-nowrap shrink-0 cursor-pointer`}
                >
                  <span
                    className={`py-1 border-b-2 transition-colors duration-300 ${
                      active
                        ? "border-[#60a5fa] text-[#60a5fa]"
                        : "border-transparent text-gray-700 hover:border-[#60a5fa] hover:text-[#60a5fa]"
                    }`}
                  >
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-1.5 py-0.2 rounded-full leading-tight uppercase animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Modal: Hệ thống Salon chi nhánh */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-base font-black text-gray-900">
            <MapPin size={20} className="text-[#60a5fa]" />
            HỆ THỐNG SALON BACHBARBER TOÀN QUỐC
          </div>
        }
        open={salonsModalOpen}
        onCancel={() => setSalonsModalOpen(false)}
        footer={null}
        centered
        width={680}
        className="rounded-3xl overflow-hidden"
      >
        <p className="text-gray-500 text-xs mb-4">
          Hệ thống gồm các chi nhánh không gian chuẩn 5 sao, bãi đỗ xe rộng rãi, phục vụ từ 8h30 đến 21h30 hàng ngày.
        </p>
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {salons.map((s) => (
            <div
              key={s.id}
              className="p-4 rounded-2xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">{s.salonName || s.name}</h4>
                <p className="text-gray-600 text-xs mb-1 flex items-center gap-1.5">
                  <MapPin size={13} className="text-[#60a5fa] shrink-0" />
                  {s.address}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                  <span>📞 Hotline: {s.phoneNumber || '1900.27.27.27'}</span>
                  <span>•</span>
                  <span>⏰ Giờ mở cửa: {s.openTime || '08:30'} - {s.closeTime || '21:30'}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSalonsModalOpen(false);
                  if (!authenticated) {
                    openLoginModal('Quý khách cần đăng nhập tài khoản để thực hiện đặt lịch dịch vụ!', '/booking');
                    return;
                  }
                  navigate('/booking');
                }}
                className="bg-[#60a5fa] hover:bg-blue-500 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all shadow-sm shrink-0"
              >
                Đặt lịch tại đây
              </button>
            </div>
          ))}
        </div>
      </Modal>

      {/* Modal: Ưu đãi & Voucher */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-base font-black text-gray-900">
            <Gift size={20} className="text-amber-500" />
            ƯU ĐÃI & MÃ GIẢM GIÁ ĐỘC QUYỀN
          </div>
        }
        open={promoModalOpen}
        onCancel={() => setPromoModalOpen(false)}
        footer={null}
        centered
        width={540}
        className="rounded-3xl overflow-hidden"
      >
        <div className="space-y-3 py-2">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">HỘI VIÊN MỚI</span>
              <h4 className="font-black text-gray-900 text-base mb-0.5">Giảm 20% Dịch Vụ Cắt Gội</h4>
              <p className="text-xs text-gray-600 mb-0">Mã voucher: <strong className="font-mono text-amber-800">CHAOBANMOI</strong></p>
            </div>
            <Tag color="warning" className="font-bold text-xs rounded-full px-3 py-0.5">Giảm 20%</Tag>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">COMBO ĐẲNG CẤP</span>
              <h4 className="font-black text-gray-900 text-base mb-0.5">Tặng Voucher 50.000₫ Uốn Nhuộm</h4>
              <p className="text-xs text-gray-600 mb-0">Mã voucher: <strong className="font-mono text-blue-800">COMBOVIP50</strong></p>
            </div>
            <Tag color="processing" className="font-bold text-xs rounded-full px-3 py-0.5">-50.000₫</Tag>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 text-center">
          <button
            type="button"
            onClick={() => {
              setPromoModalOpen(false);
              if (!authenticated) {
                openLoginModal('Quý khách cần đăng nhập tài khoản để áp dụng voucher đặt lịch!', '/booking');
                return;
              }
              navigate('/booking');
            }}
            className="w-full bg-[#60a5fa] hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md uppercase"
          >
            Áp dụng mã & Đặt lịch ngay
          </button>
        </div>
      </Modal>
    </>
  );
}
