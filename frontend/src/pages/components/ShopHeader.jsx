import React from 'react';
import { Badge, Dropdown, Avatar, Tag, Modal } from 'antd';
import { useAuth } from '../../auth/authProvider';
import { useNavigate } from 'react-router-dom';
import { UserCircle, CalendarCheck, FileText, LogOut } from 'lucide-react';

const ShopHeader = ({ onLoginClick, onRegisterClick, onCartClick, cartCount }) => {
  const { authenticated, userInfo, logout, openLoginModal } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    if (onLoginClick) onLoginClick();
    else openLoginModal();
  };

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

  return (
    <div className="w-full bg-white text-black shadow-md">
      <div className="max-w-[1280px] mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
          >
            <span className="text-2xl font-black italic tracking-wider text-black">BachBarber</span>
            <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded font-bold uppercase">SHOP</span>
          </div>

          <div className="hidden lg:flex items-center relative w-80 outline outline-1 rounded-2xl outline-gray-300">
            <input
              type="text"
              placeholder="Nhập tên sản phẩm, thương hiệu..."
              className="w-full bg-white text-gray-800 text-sm rounded-md py-2 pl-3 pr-10 focus:outline-none"
            />
            <button className="absolute right-3 text-gray-500 hover:text-gray-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {authenticated ? (
            <Dropdown menu={{ items: userMenu }} placement="bottomRight" arrow trigger={['click']}>
              <div className="flex items-center gap-2.5 cursor-pointer py-1 px-2.5 rounded-full hover:bg-gray-100 transition-colors">
                <Avatar
                  size={34}
                  src={userInfo?.avatarUrl}
                  className="bg-blue-600 text-white font-bold"
                >
                  {(userInfo?.fullName || userInfo?.username || 'U')[0].toUpperCase()}
                </Avatar>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-gray-800 leading-tight">
                    {userInfo?.fullName || userInfo?.username}
                  </span>
                  <span className="text-[10px] text-gray-400 font-semibold">Tài khoản</span>
                </div>
              </div>
            </Dropdown>
          ) : (
            <button
              onClick={handleLogin}
              className="text-black font-bold py-2 px-4 rounded-xl flex items-center gap-2 hover:bg-gray-100 hover:text-blue-600 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              <span>ĐĂNG NHẬP</span>
            </button>
          )}

          <div
            onClick={onCartClick}
            className="flex items-center relative cursor-pointer px-2.5 transition-colors"
          >
            <span className="flex items-center group cursor-pointer text-black">
              <Badge
                count={cartCount} size="small" offset={[2, 0]}
              >
                <svg
                  className="w-5 h-5 text-black group-hover:text-blue-500 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </Badge>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopHeader;