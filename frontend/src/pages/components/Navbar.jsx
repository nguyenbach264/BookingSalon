import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Scissors,
  ShoppingBag,
  MapPin,
  Gift,
  Star,
} from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    {
      key: 'service',
      label: 'DỊCH VỤ',
      path: '/service',
      icon: <Scissors size={15} />,
    },
    {
      key: 'shop',
      label: 'CỬA HÀNG',
      path: '/shop',
      icon: <ShoppingBag size={15} />,
    },
    {
      key: 'salons',
      label: 'HỆ THỐNG SALON',
      path: '/salons',
      icon: <MapPin size={15} />,
    },
    {
      key: 'promotions',
      label: 'ƯU ĐÃI & VOUCHER',
      path: '/promotions',
      icon: <Gift size={15} />,
      badge: 'HOT',
    },
    {
      key: 'about',
      label: 'VỀ CHÚNG TÔI',
      path: '/about',
      icon: <Star size={15} />,
    },
  ];

  return (
    <nav
      className="hidden md:block w-full bg-[#0099FF] text-white select-none border-t border-white/20 border-b border-black/10 shadow-md sticky top-0 z-30 transition-colors"
      style={{ backgroundColor: 'var(--primary-color, #0099FF)' }}
    >
      <div className="max-w-[1280px] mx-auto px-4 flex items-center">
        {/* Main Navigation Links (Desktop view: dàn đều hoàn hảo không cần cuộn) */}
        <div className="flex justify-between items-center w-full gap-1 lg:gap-2">
          
          {/* Home Icon Button: Căn lề trái thẳng hàng tuyệt đối với Logo ở Header (pl-0) */}
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Trang chủ"
            className="flex items-center justify-center pl-0 pr-3 sm:pr-4 py-2.5 shrink-0 cursor-pointer"
          >
            <Home
              size={24}
              className={`drop-shadow-sm py-0.5 border-b-2 transition-all duration-300 ${
                isActive('/')
                  ? 'border-white text-white scale-110'
                  : 'border-transparent text-white/85 hover:text-white hover:border-white/60'
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
                onClick={() => navigate(item.path)}
                className="flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3.5 text-xs md:text-sm font-bold tracking-wider whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span
                  className={`py-1 border-b-2 transition-all duration-200 relative ${
                    active
                      ? "border-white text-white font-extrabold"
                      : "border-transparent text-white/85 hover:text-white hover:border-white/60"
                  }`}
                >
                  {item.label}
                  {item.badge && (
                    <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-1.5 py-0.5 rounded-full leading-tight uppercase animate-pulse absolute -top-1 -right-8 shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
