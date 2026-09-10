import React, { useState, useEffect } from 'react';
import { Badge, message, Dropdown, Avatar } from 'antd';
import {
  ShoppingCart,
  User,
  Bell,
  LogOut,
  FileText,
  CalendarCheck,
  UserCircle
} from 'lucide-react';

const userMenu = [
  {
    key: 'name',
    label: <div className="font-bold text-[#1b2a4a] text-base py-1 px-1">Nguyễn Văn A</div>,
    disabled: true,
  },
  { type: 'divider' },
  {
    key: 'profile',
    icon: <UserCircle className="w-4 h-4" />,
    label: 'Thông tin tài khoản',
  },
  {
    key: 'services',
    icon: <CalendarCheck className="w-4 h-4" />,
    label: 'Dịch vụ đã đặt',
  },
  {
    key: 'orders',
    icon: <FileText className="w-4 h-4" />,
    label: 'Đơn hàng đã đặt',
  },
  { type: 'divider' },
  {
    key: 'logout',
    icon: <LogOut className="w-4 h-4 text-red-500" />,
    label: <span className="text-red-600 font-medium">Đăng xuất</span>,
    onClick: handleLogout
  },
];

const LoggedInHeader = (isLoggedIn) => {
  // const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setIsLoginModalVisible(false);
    message.success("Đăng nhập thành công!");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    message.success("Đã đăng xuất tài khoản!");
  };

  return (
    <div>
      <div className="flex items-center gap-4">
        {isLoggedIn ? (
          /* --- Giao diện Header khi ĐÃ ĐĂNG NHẬP --- */
          <div className="flex items-center gap-2 md:gap-4">
            <div className="cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors relative">
              <Badge count={3} size="small" color="#ef4444" offset={[-2, 2]}>
                <Bell className="w-[22px] h-[22px] text-gray-700" />
              </Badge>
            </div>

            <Dropdown menu={{ items: userMenu }} placement="bottomRight" trigger={['click']}>
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 md:pr-3 rounded-full transition-colors border border-transparent hover:border-gray-200">
                <Avatar src="https://i.pravatar.cc/150?img=11" size="default" className="bg-blue-100 border border-gray-200 shadow-sm" />
                <span className="hidden md:block font-medium text-gray-700 text-sm">Nguyễn Văn A</span>
              </div>
            </Dropdown>
          </div>
        ) : (
          /* --- Giao diện Header khi CHƯA ĐĂNG NHẬP --- */
          <>
            <button
              onClick={() => setIsLoginModalVisible(true)}
              className="hidden sm:flex bg-[#1b2a4a] hover:bg-[#244383] text-white px-5 py-2.5 rounded-md font-bold text-sm items-center gap-2 transition-all shadow-md"
            >
              <User className="w-4 h-4" /> ĐĂNG NHẬP
            </button>
            <button
              onClick={() => setIsRegisterModalVisible(true)}
              className="hidden sm:flex border-2 border-[#1b2a4a] text-[#1b2a4a] hover:bg-gray-50 px-5 py-2.5 rounded-md font-bold text-sm items-center transition-all"
            >
              ĐĂNG KÝ
            </button>
          </>
        )}

        <button
          className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center relative transition-colors ml-0 md:ml-2"
          onClick={() => setIsCartVisible(true)}
        >
          <Badge count={totalCartItems} size="small" color="#ef4444" offset={[-2, 2]}>
            <ShoppingCart className="w-5 h-5 text-gray-700" />
          </Badge>
        </button>
      </div>
    </div >
  );
}

export default LoggedInHeader; 