import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Modal, Badge, Dropdown, Avatar, Tag, Popover, Empty } from 'antd';
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
} from 'lucide-react';
import { useNotification } from '../../service/context/NotificationContext';
import { useAuth } from '../../auth/authProvider';
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
  } = useNotification();
  const { userInfo, initialized, authenticated, logout, openLoginModal } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  // Reset giá trị tìm kiếm khi chuyển trang (chỉ giữ lại query khi đang ở trang /service)
  useEffect(() => {
    if (location.pathname === '/service') {
      const params = new URLSearchParams(location.search);
      const query = params.get('search') || '';
      setSearchValue(query);
    } else {
      setSearchValue('');
      setMobileSearchOpen(false);
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
    const type = notif.type || 'INFO';
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
                onClick={() => {
                  if (!notif.isRead) markAsRead(notif.id);
                  setNotificationOpen(false);
                  if (config.targetRoute) navigate(config.targetRoute);
                }}
                className={`p-3.5 transition-colors cursor-pointer hover:bg-blue-50/40 relative flex gap-3 ${
                  !notif.isRead ? 'bg-blue-50/20' : 'bg-white'
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
                        if (!notif.isRead) markAsRead(notif.id);
                        setNotificationOpen(false);
                        if (config.targetRoute) navigate(config.targetRoute);
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {config.actionButton} →
                    </button>
                  )}
                </div>

                {!notif.isRead && (
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1" />
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
    <header className="w-full bg-white text-gray-900 border-b border-gray-100 shadow-sm relative z-50">
      <div className="max-w-[1280px] mx-auto px-4 h-16 flex items-center justify-between gap-3 sm:gap-6">

        {/* ── 1. LOGO (24h left block) ──────────────── */}
        <div className="flex items-center gap-4 shrink-0">
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-[#60a5fa] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Scissors size={20} className="rotate-45" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black italic tracking-wider text-gray-900 group-hover:text-[#60a5fa] transition-colors leading-none">
                BachBarber
              </span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-tight mt-0.5 hidden sm:block">
                Premium Salon
              </span>
            </div>
          </div>
        </div>

        {/* ── 2. CENTER SEARCH BAR (Desktop & Tablet) ────── */}
        <div className="hidden sm:flex flex-1 max-w-xs md:max-w-sm lg:max-w-md mx-2 justify-center">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex items-center w-full bg-gray-50 hover:bg-white focus-within:bg-white border border-gray-200 focus-within:border-[#60a5fa] focus-within:ring-2 focus-within:ring-[#60a5fa]/20 rounded-full transition-all duration-200 shadow-inner"
          >
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Tìm dịch vụ cắt, uốn, nhuộm..."
              className="w-full bg-transparent text-gray-800 text-xs sm:text-sm pl-4 pr-10 py-[7px] focus:outline-none placeholder:text-gray-400"
            />
            <button
              type="submit"
              aria-label="Tìm kiếm"
              className="absolute right-1.5 w-7 h-7 flex items-center justify-center rounded-full bg-[#60a5fa] hover:bg-blue-500 text-white cursor-pointer transition-transform hover:scale-105 active:scale-95"
            >
              <Search size={13} />
            </button>
          </form>
        </div>

        {/* ── 3. RIGHT ACTIONS: BELL & USER PROFILE ────── */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Nút tìm kiếm trên Mobile */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="Tìm kiếm dịch vụ"
            className="sm:hidden p-2 rounded-full hover:bg-gray-100 text-gray-700 active:scale-95 transition-all"
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
                <div className="cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors relative">
                  <Badge
                    count={unreadCount}
                    size="small"
                    color="#ef4444"
                    offset={[-1, 1]}
                  >
                    <Bell className="w-5 h-5 text-gray-700 hover:text-[#60a5fa] transition-colors" />
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
                <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 py-1 px-1.5 sm:px-2.5 rounded-full transition-all border border-transparent hover:border-gray-200">
                  <Avatar
                    src={
                      userInfo?.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        userInfo?.fullName || userInfo?.username || 'User'
                      )}&background=60a5fa&color=fff`
                    }
                    size={32}
                    className="border border-blue-200 shadow-sm bg-[#60a5fa]"
                  />
                  <div className="hidden xl:flex flex-col text-left leading-tight">
                    <span className="font-bold text-gray-800 text-xs truncate max-w-[110px]">
                      {userInfo?.fullName || userInfo?.username}
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">
                      {userInfo?.membershipTier || 'STANDARD'}
                    </span>
                  </div>
                  <ChevronDown size={14} className="text-gray-400 hidden xl:block" />
                </div>
              </Dropdown>
            </div>
          ) : (
            /* Chưa đăng nhập */
            <button
              type="button"
              onClick={onLoginClick}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs py-2 px-2 sm:px-4 rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UserCircle size={20} className="text-gray-600" />
              <span className="text-[16px] sm:block hidden">Đăng nhập</span>
            </button>
          )}
        </div>
      </div>

      {/* ── MOBILE SEARCH OVERLAY ─────────────────────────────────────── */}
      {mobileSearchOpen && (
        <div className="sm:hidden absolute inset-0 bg-white z-50 px-4 flex items-center gap-2 shadow-md">
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
      )}
    </header>
  );
};

export default Header;