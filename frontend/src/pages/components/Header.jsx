import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Modal, Badge, Dropdown, Avatar, Tag, Popover, Empty, Button, Spin, Drawer } from 'antd';
import {
  Bell,
  LogOut,
  FileText,
  CalendarCheck,
  UserCircle,
  Scissors,
  Search,
  Calendar,
  Sparkles,
  ChevronDown,
  X,
  PackageCheck,
  AlertTriangle,
  CheckCheck,
  Clock,
  Menu,
  Home,
  ShoppingBag,
  MapPin,
  Gift,
  Star,
  Phone,
} from 'lucide-react';
import { useNotification } from '../../service/context/NotificationContext';
import { useAuth } from '../../auth/authProvider';
import { getServiceOfferings } from '../../service/api/serviceApi';
import HeaderSkeleton from './HeaderSkeleton';

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'Vừa xong';
  const date = Array.isArray(dateStr) ? new Date(...dateStr) : new Date(dateStr);
  const diffSec = Math.floor((new Date() - date) / 1000);
  if (diffSec < 60) return 'Vừa xong';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} ngày trước`;
  return date.toLocaleDateString('vi-VN');
};

const Header = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    setSelectedNotification,
    fetchSingleNotification,
  } = useNotification();
  const { userInfo, initialized, authenticated, logout, openLoginModal } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [allServices, setAllServices] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);

  // Tự động đóng menu điều hướng và tìm kiếm trên mobile khi chuyển trang
  useEffect(() => {
    setMobileNavOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    getServiceOfferings()
      .then((data) => {
        if (Array.isArray(data)) setAllServices(data);
      })
      .catch((err) => console.warn('Could not load services for suggestions:', err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSuggestions = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return [];
    return allServices
      .filter((s) => (s.name || '').toLowerCase().includes(q) || (s.categoryName || '').toLowerCase().includes(q))
      .slice(0, 6);
  }, [allServices, searchValue]);

  const handleSelectService = (service) => {
    setShowSuggestions(false);
    setMobileSearchOpen(false);
    setSearchValue(service.name);
    navigate(`/service?search=${encodeURIComponent(service.name)}`);
  };

  const handleNotificationClick = (notif) => {
    setNotificationOpen(false);
    if (!notif?.id) return;
    if (!notif.isRead) {
      markAsRead(notif.id);
    }
    navigate(`/notification_detail?id=${notif.id}`);
  };

  // Reset giá trị tìm kiếm khi chuyển trang (chỉ giữ lại query khi đang ở trang /service)
  useEffect(() => {
    if (location.pathname === '/service') {
      const params = new URLSearchParams(location.search);
      const query = params.get('search') || '';
      setSearchValue(query);
    } else {
      setSearchValue('');
      setMobileSearchOpen(false);
      setShowSuggestions(false);
    }
  }, [location.pathname, location.search]);

  const handleLogout = () => {
    Modal.confirm({
      title: 'Đăng xuất tài khoản',
      content: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?',
      okText: 'Đăng xuất',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: async () => {
        await logout();
        navigate('/');
      },
    });
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const query = searchValue.trim();
    if (!query) return;
    setShowSuggestions(false);
    setMobileSearchOpen(false);
    navigate(`/service?search=${encodeURIComponent(query)}`);
  };

  const getTierBadge = (tier) => {
    switch (tier?.toUpperCase()) {
      case 'VIP':
        return <Tag color="gold" className="text-[10px] font-black rounded-full px-2 border-none">VIP</Tag>;
      case 'GOLD':
        return <Tag color="yellow" className="text-[10px] font-black rounded-full px-2 border-none">GOLD</Tag>;
      case 'SILVER':
        return <Tag color="default" className="text-[10px] font-black rounded-full px-2 border-none">SILVER</Tag>;
      default:
        return <Tag color="blue" className="text-[10px] font-black rounded-full px-2 border-none">MEMBER</Tag>;
    }
  };

  const userMenu = [
    {
      key: 'name',
      label: (
        <div className="py-1.5 px-2">
          <div className="font-black text-gray-900 text-sm">
            {userInfo?.fullName || userInfo?.username || 'Khách hàng'}
          </div>
          <div className="text-[11px] text-gray-500 font-medium flex items-center gap-1.5 mt-0.5">
            <span>Hạng:</span>
            {getTierBadge(userInfo?.membershipTier)}
          </div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'profile',
      icon: <UserCircle className="w-4 h-4 text-[#60a5fa]" />,
      label: <span className="font-semibold text-xs">Thông tin tài khoản</span>,
      onClick: () => navigate('/profile'),
    },
    {
      key: 'services',
      icon: <CalendarCheck className="w-4 h-4 text-emerald-500" />,
      label: <span className="font-semibold text-xs">Dịch vụ đã đặt</span>,
      onClick: () => navigate('/my-bookings'),
    },
    {
      key: 'orders',
      icon: <FileText className="w-4 h-4 text-amber-500" />,
      label: <span className="font-semibold text-xs">Đơn hàng đã đặt</span>,
      onClick: () => navigate('/my-orders'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogOut className="w-4 h-4 text-red-500" />,
      label: <span className="text-red-600 font-bold text-xs">Đăng xuất</span>,
      onClick: handleLogout,
    },
  ];

  // Cấu hình giao diện riêng biệt cho từng loại thông báo (User Notification Types)
  const getNotificationConfig = (notif) => {
    const type = notif?.type || 'INFO';
    if (type === 'BOOKING_CREATED') {
      return {
        tag: <Tag color="green" className="text-[9px] font-bold border-none px-1.5 rounded-full">Đặt lịch mới</Tag>,
        icon: <Calendar className="w-4 h-4 text-emerald-600" />,
        iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
        actionButton: 'Xem lịch hẹn',
        targetRoute: '/my-bookings',
      };
    }
    if (type === 'BOOKING_CONFIRMED') {
      return {
        tag: <Tag color="blue" className="text-[9px] font-bold border-none px-1.5 rounded-full">Stylist đã nhận lịch</Tag>,
        icon: <Scissors className="w-4 h-4 text-blue-600" />,
        iconBg: 'bg-blue-50 text-blue-600 border border-blue-100',
        actionButton: 'Xem chi tiết',
        targetRoute: '/my-bookings',
      };
    }
    if (type === 'BOOKING_CANCELLED') {
      return {
        tag: <Tag color="error" className="text-[9px] font-bold border-none px-1.5 rounded-full">Đã hủy</Tag>,
        icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
        iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
        actionButton: 'Đặt lại lịch',
        targetRoute: '/booking',
      };
    }
    if (type === 'ORDER_DELIVERED') {
      return {
        tag: <Tag color="purple" className="text-[9px] font-bold border-none px-1.5 rounded-full">Giao hàng thành công</Tag>,
        icon: <PackageCheck className="w-4 h-4 text-purple-600" />,
        iconBg: 'bg-purple-50 text-purple-600 border border-purple-100',
        actionButton: 'Xem đơn hàng',
        targetRoute: '/my-orders',
      };
    }
    if (type === 'REVIEW_REQUEST' || type === 'BOOKING_COMPLETED') {
      return {
        tag: <Tag color="gold" className="text-[9px] font-bold border-none px-1.5 rounded-full">Yêu cầu đánh giá</Tag>,
        icon: <Sparkles className="w-4 h-4 text-amber-500" />,
        iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
        actionButton: 'Đánh giá ngay',
        targetRoute: '/my-bookings',
      };
    }
    return {
      tag: <Tag color="default" className="text-[9px] font-bold border-none px-1.5 rounded-full">Hệ thống</Tag>,
      icon: <Bell className="w-4 h-4 text-blue-500" />,
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-100',
      actionButton: null,
      targetRoute: '/my-bookings',
    };
  };

  const notificationPopoverContent = (
    <div className="w-[330px] sm:w-[370px] max-h-[500px] flex flex-col -m-3">
      {/* Top Header */}
      <div className="p-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70 rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className="font-black text-gray-900 text-sm">Thông báo của bạn</span>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {unreadCount} mới
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllAsRead()}
            className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Đọc tất cả
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto max-h-[380px] divide-y divide-gray-100">
        {notifications.length === 0 ? (
          <div className="py-10 text-center">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span className="text-gray-400 text-xs">Chưa có thông báo nào</span>}
            />
          </div>
        ) : (
          notifications.map((notif) => {
            const config = getNotificationConfig(notif);
            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 transition-all duration-200 cursor-pointer relative flex gap-3 ${
                  !notif.isRead
                    ? 'bg-blue-50/90 hover:bg-blue-200/80 border-l-4 border-l-blue-600 shadow-xs'
                    : 'bg-white hover:bg-slate-200/70 border-l-4 border-l-transparent hover:border-l-blue-400'
                }`}
              >
                {/* Icon Circle */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${config.iconBg}`}>
                  {config.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {config.tag}
                    </span>
                    <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                      {formatTimeAgo(notif.createdAt)}
                    </span>
                  </div>

                  <h4 className={`text-xs font-bold leading-tight mb-1 ${!notif.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                    {notif.title}
                  </h4>

                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed mb-2">
                    {notif.message}
                  </p>

                  {config.actionButton && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNotificationClick(notif);
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {config.actionButton} →
                    </button>
                  )}
                </div>

                {!notif.isRead && (
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-1 shadow-xs" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer link */}
      <div className="p-2.5 border-t border-gray-100 text-center bg-gray-50/50 rounded-b-xl">
        <button
          type="button"
          onClick={() => {
            setNotificationOpen(false);
            navigate('/my-bookings');
          }}
          className="text-xs font-bold text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
        >
          Quản lý lịch hẹn & Đơn hàng →
        </button>
      </div>
    </div>
  );

  return (
    <header
      className="w-full bg-[#0099FF] text-white border-b border-white/20 shadow-xs relative z-50 transition-colors"
      style={{ backgroundColor: 'var(--primary-color, #0099FF)' }}
    >
      <div className="max-w-[1280px] mx-auto px-4 h-16 flex items-center justify-between gap-3 sm:gap-6">

        {/* ── 1. LOGO & NÚT ĐIỀU HƯỚNG ẨN TRÊN MOBILE ── */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Nút điều hướng ẩn (Chỉ hiện trên mobile, bấm mở menu trượt) */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Mở menu điều hướng"
            className="md:hidden p-2 -ml-1 rounded-xl text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
          >
            <Menu size={22} />
          </button>

          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-white text-[#0099FF] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform" style={{ color: 'var(--primary-color, #0099FF)' }}>
              <Scissors size={20} className="rotate-45" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black italic tracking-wider text-white transition-colors leading-none drop-shadow-xs">
                BachBarber
              </span>
              <span className="text-[9px] font-bold text-white/80 uppercase tracking-widest leading-tight mt-0.5 hidden sm:block">
                Premium Salon
              </span>
            </div>
          </div>
        </div>

        {/* ── 2. CENTER SEARCH BAR (Desktop & Tablet) ────── */}
        <div ref={searchContainerRef} className="hidden sm:flex flex-1 max-w-xs md:max-w-sm lg:max-w-md mx-2 justify-center relative">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex items-center w-full bg-white/20 hover:bg-white/30 focus-within:bg-white border border-white/30 focus-within:border-white rounded-full transition-all duration-200 shadow-inner group/form"
          >
            <input
              type="text"
              value={searchValue}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setSearchValue(e.target.value);
                setShowSuggestions(true);
              }}
              placeholder="Tìm dịch vụ cắt, uốn, tạo kiểu..."
              className="w-full bg-transparent text-white group-focus-within/form:text-gray-900 text-xs sm:text-sm pl-4 pr-10 py-[7px] focus:outline-none placeholder:text-white/80 group-focus-within/form:placeholder:text-gray-400"
            />
            <button
              type="submit"
              aria-label="Tìm kiếm"
              className="absolute right-1.5 w-7 h-7 flex items-center justify-center rounded-full bg-white text-[#0099FF] cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-xs"
              style={{ color: 'var(--primary-color, #0099FF)' }}
            >
              <Search size={13} />
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {showSuggestions && searchValue.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[100] divide-y divide-gray-50 text-gray-800">
              <div className="px-3 py-2 bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                <span>Gợi ý dịch vụ</span>
                <span className="text-[10px] text-[#0099FF] font-semibold" style={{ color: 'var(--primary-color, #0099FF)' }}>{filteredSuggestions.length} kết quả</span>
              </div>
              {filteredSuggestions.length > 0 ? (
                filteredSuggestions.map((service) => (
                  <div
                    key={service.id || service.serviceId}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectService(service);
                    }}
                    className="px-3.5 py-2.5 hover:bg-blue-50/80 cursor-pointer flex items-center justify-between gap-3 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 group-hover:bg-blue-100 text-[#0099FF] flex items-center justify-center shrink-0" style={{ color: 'var(--primary-color, #0099FF)' }}>
                        <Scissors size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800 group-hover:text-[#0099FF] truncate mb-0" style={{ '--tw-text-opacity': 1 }}>
                          {service.name}
                        </p>
                        <span className="text-[10px] text-gray-400">
                          {service.categoryName || 'Dịch vụ Salon'} • {service.duration || 30} phút
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#0099FF] shrink-0" style={{ color: 'var(--primary-color, #0099FF)' }}>
                      {new Intl.NumberFormat('vi-VN').format(service.price || 0)}đ
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-xs text-gray-400">
                  Không tìm thấy dịch vụ nào cho "{searchValue}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 3. RIGHT ACTIONS: BELL & USER PROFILE ────── */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Nút tìm kiếm trên Mobile */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="Tìm kiếm dịch vụ"
            className="sm:hidden p-2 rounded-full hover:bg-white/20 text-white active:scale-95 transition-all"
          >
            <Search size={20} />
          </button>

          {/* Đăng nhập */}
          {!initialized ? (
            <HeaderSkeleton />
          ) : authenticated ? (
            /* Đã đăng nhập: Chuông thông báo WebSocket + Avatar Dropdown */
            <div className="flex items-center gap-2">
              {/* Real-time Notification Bell Popover */}
              <Popover
                content={notificationPopoverContent}
                trigger="click"
                placement="bottomRight"
                open={notificationOpen}
                onOpenChange={setNotificationOpen}
                overlayClassName="realtime-notification-popover"
              >
                <div className="cursor-pointer p-2 hover:bg-white/20 rounded-full transition-colors relative">
                  <Badge
                    count={unreadCount}
                    size="small"
                    color="#ef4444"
                    offset={[-1, 1]}
                  >
                    <Bell className="w-5 h-5 text-white hover:text-white/80 transition-colors" />
                  </Badge>
                </div>
              </Popover>

              {/* User Avatar Dropdown */}
              <Dropdown
                menu={{ items: userMenu }}
                placement="bottomRight"
                trigger={['click']}
                overlayClassName="shadow-2xl border border-gray-100 rounded-2xl min-w-[200px]"
              >
                <div className="flex items-center gap-2 cursor-pointer hover:bg-white/15 py-1 px-1.5 sm:px-2.5 rounded-full transition-all border border-transparent hover:border-white/20">
                  <Avatar
                    src={
                      userInfo?.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        userInfo?.fullName || userInfo?.username || 'User'
                      )}&background=0099FF&color=fff`
                    }
                    size={32}
                    className="border-2 border-white shadow-sm bg-white text-[#0099FF] font-bold"
                  />
                  <div className="hidden xl:flex flex-col text-left leading-tight">
                    <span className="font-bold text-white text-xs truncate max-w-[110px]">
                      {userInfo?.fullName || userInfo?.username}
                    </span>
                    <span className="text-[10px] text-white/80 font-semibold uppercase">
                      {userInfo?.membershipTier || 'STANDARD'}
                    </span>
                  </div>
                  <ChevronDown size={14} className="text-white/80 hidden xl:block" />
                </div>
              </Dropdown>
            </div>
          ) : (
            /* Chưa đăng nhập */
            <button
              type="button"
              onClick={onLoginClick}
              className="bg-white hover:bg-white/90 text-[#0099FF] font-bold text-xs py-2 px-3 sm:px-4 rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              style={{ color: 'var(--primary-color, #0099FF)' }}
            >
              <UserCircle size={18} />
              <span className="text-[14px] sm:block hidden font-semibold">Đăng nhập</span>
            </button>
          )}
        </div>
      </div>

      {/* ── MOBILE SEARCH OVERLAY ─────────────────────────────────────── */}
      {mobileSearchOpen && (
        <div className="sm:hidden absolute inset-0 bg-white z-50 px-4 py-3 flex flex-col justify-start shadow-md max-h-96">
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
              <input
                type="text"
                autoFocus
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Tìm dịch vụ cắt, uốn, nhuộm..."
                className="w-full bg-gray-100 text-gray-800 text-sm pl-4 pr-10 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#60a5fa]"
              />
              <button
                type="submit"
                aria-label="Tìm kiếm"
                className="absolute right-1.5 w-7 h-7 flex items-center justify-center rounded-full bg-[#60a5fa] hover:bg-blue-500 text-white"
              >
                <Search size={14} />
              </button>
            </form>
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              aria-label="Đóng tìm kiếm"
              className="p-1.5 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          {searchValue.trim() && filteredSuggestions.length > 0 && (
            <div className="mt-2 bg-white rounded-xl border border-gray-100 overflow-y-auto divide-y divide-gray-50">
              {filteredSuggestions.map((service) => (
                <div
                  key={service.id || service.serviceId}
                  onClick={() => handleSelectService(service)}
                  className="px-3 py-2 flex items-center justify-between text-xs hover:bg-blue-50"
                >
                  <span className="font-semibold text-gray-800 truncate">{service.name}</span>
                  <span className="font-bold text-blue-600 shrink-0 ml-2">{new Intl.NumberFormat('vi-VN').format(service.price || 0)}đ</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 4. MOBILE NAVIGATION DRAWER (Ant Design Portal - 100% Responsive & Kín Màn Hình) ───────── */}
      <Drawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        placement="left"
        closable={false}
        width={300}
        styles={{
          body: { padding: 0 },
          mask: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0, 0, 0, 0.6)' },
        }}
        className="md:hidden"
      >
        <div className="flex flex-col justify-between h-full bg-white text-slate-800">
          <div>
            {/* Drawer Top Header */}
            <div 
              className="p-4 flex items-center justify-between text-white"
              style={{ backgroundColor: 'var(--primary-color, #0099FF)' }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white text-[#0099FF] flex items-center justify-center font-bold shadow-xs" style={{ color: 'var(--primary-color, #0099FF)' }}>
                  <Scissors size={18} className="rotate-45" />
                </div>
                <div>
                  <span className="text-lg font-black italic tracking-wider block leading-none">BachBarber</span>
                  <span className="text-[9px] font-bold text-white/80 uppercase tracking-widest">Premium Salon</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 rounded-lg text-white hover:bg-white/20 active:scale-95 cursor-pointer"
                aria-label="Đóng menu điều hướng"
              >
                <X size={20} />
              </button>
            </div>

            {/* User Account Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              {authenticated ? (
                <div className="flex items-center gap-3">
                  <Avatar
                    src={userInfo?.avatarUrl}
                    size={40}
                    className="border-2 border-white shadow-xs bg-[#0099FF] text-white font-bold"
                  >
                    {(userInfo?.fullName || userInfo?.username || 'U')[0].toUpperCase()}
                  </Avatar>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-xs truncate">
                      {userInfo?.fullName || userInfo?.username}
                    </div>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full inline-block mt-0.5">
                      {userInfo?.membershipTier || 'Thành viên'}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileNavOpen(false);
                    if (onLoginClick) onLoginClick();
                    else openLoginModal();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-all"
                  style={{ backgroundColor: 'var(--primary-color, #0099FF)' }}
                >
                  <UserCircle size={16} />
                  <span>Đăng nhập / Đăng ký</span>
                </button>
              )}
            </div>

            {/* Navigation Links List */}
            <div className="p-3 space-y-1">
              {[
                { label: 'Trang chủ', path: '/', icon: <Home size={18} /> },
                { label: 'Dịch vụ Salon', path: '/service', icon: <Scissors size={18} /> },
                { label: 'Cửa hàng mỹ phẩm', path: '/shop', icon: <ShoppingBag size={18} /> },
                { label: 'Hệ thống Salon', path: '/salons', icon: <MapPin size={18} /> },
                { label: 'Ưu đãi & Voucher', path: '/promotions', icon: <Gift size={18} />, badge: 'HOT' },
                { label: 'Về chúng tôi', path: '/about', icon: <Star size={18} /> },
              ].map((item) => {
                const active = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => {
                      setMobileNavOpen(false);
                      navigate(item.path);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                      active
                        ? 'bg-blue-50 text-[#0099FF] font-extrabold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={active ? 'text-[#0099FF]' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-900 uppercase">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Drawer Bottom CTA */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-2.5">
            <button
              type="button"
              onClick={() => {
                setMobileNavOpen(false);
                navigate('/booking');
              }}
              className="w-full py-3 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-95 transition-all"
              style={{ backgroundColor: 'var(--primary-color, #0099FF)' }}
            >
              <Scissors size={15} />
              <span>Đặt Lịch Cắt Tóc Ngay</span>
            </button>
            <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5 pt-1">
              <Phone size={12} className="text-[#0099FF]" />
              <span>Hotline: <strong>1900 2828</strong> (08:30 - 21:30)</span>
            </div>
          </div>
        </div>
      </Drawer>

    </header>
  );
};

export default Header;