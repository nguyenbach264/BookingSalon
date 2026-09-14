import React, { createContext, useState } from 'react';
import { useNavigate } from "react-router-dom";
import api from '../../service/api/axiosApi';

import { Modal, Badge, Dropdown, Avatar } from 'antd';
import { Bell, LogOut, FileText, CalendarCheck, UserCircle } from 'lucide-react';
import { useNotification } from '../../service/context/NotificationContext';
import { useAuth } from '../../auth/authProvider';
import HeaderSkeleton from './HeaderSkeleton';

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Đặt hàng thành công',
    description: 'Đơn hàng #DH12345 của bạn đã được đặt thành công. Hệ thống đang xử lý và sẽ giao hàng trong thời gian sớm nhất!',
    time: '10 phút trước',
    type: 'order',
    isRead: false
  },
  {
    id: 2,
    title: 'Đặt lịch cắt tóc thành công',
    description: 'Lịch hẹn cắt tóc VIP lúc 15:30 ngày mai tại 30Shine đã được xác nhận. Vui lòng đến đúng giờ bạn nhé.',
    time: '2 giờ trước',
    type: 'service',
    isRead: false
  },
  {
    id: 3,
    title: 'Khuyến mãi đặc biệt mừng lễ',
    description: 'Giảm ngay 20% cho các sản phẩm Sáp vuốt tóc nam. Mã giảm giá tự động lưu vào ví của bạn. Mua sắm ngay!',
    time: '1 ngày trước',
    type: 'promo',
    isRead: true
  }
];

const Header = ({ onLoginClick, isLoggedIn }) => {
  const navigate = useNavigate();

  const { setSelectedNotification } = useNotification();
  const { userInfo, initialized, authenticated, logout } = useAuth();

  const handleLogout = () => {
    Modal.confirm({
      title: "Đăng xuất",
      content: "Bạn có chắc chắn muốn đăng xuất không?",
      okText: "Đăng xuất",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: async () => { await logout(); navigate("/"); }
    });
  };

  const userMenu = [
    {
      key: 'name',
      label: <div className="font-bold text-[#1b2a4a] text-base py-1 px-1">{userInfo?.fullName}</div>,
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

  const handleNotificationClick = (notification) => {
    console.log("Notification clicked:", userInfo);
    setSelectedNotification(notification);  
    navigate("/notification_detail")
  };

  const notificationMenu = MOCK_NOTIFICATIONS.map(notif => ({
    key: notif.id,
    label: (
      <div className="flex flex-col py-1 min-w-[280px] max-w-[320px] group" onClick={() => handleNotificationClick(notif)}>
        <div className="flex justify-between items-start mb-1 gap-2">
          <span className={`font-semibold text-sm group-hover:text-blue-600 transition-colors ${notif.isRead ? 'text-gray-700' : 'text-[#1b2a4a]'}`}>
            {notif.title}
          </span>
          {!notif.isRead && <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0"></span>}
        </div>
        <p className="text-xs text-gray-500 line-clamp-2 mb-1.5 leading-snug">{notif.description}</p>
        <span className="text-[10px] text-gray-400 font-medium">{notif.time}</span>
      </div>
    )
  }));

  return (
    <>
      <div className="w-full bg-white text-black shadow-md">
        <div className="max-w-[1280px] mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <span className="text-2xl font-black italic tracking-wider text-black">BachBarber</span>
            </div>

            <div className="hidden lg:flex items-center relative w-80 outline outline-1 rounded-2xl outline-gray-300">
              <input
                type="text"
                placeholder="Nhập tên sản phẩm, thương hiệu..."
                className="w-full bg-white text-gray-800 text-sm rounded-md py-2 pl-3 pr-10 focus:outline-none"
              />
              <button className="absolute right-3 text-gray-500 hover:text-gray-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </button>
            </div>
          </div>


          {!initialized ? (
            <HeaderSkeleton />
          ) :
            authenticated ? (
              /* --- Giao diện Header khi ĐÃ ĐĂNG NHẬP --- */
              <div className="flex items-center gap-2 md:gap-4">
                <Dropdown menu={{ items: notificationMenu }} placement="bottomRight" trigger={['click']} overlayClassName="shadow-xl border border-gray-100 rounded-lg">
                  <div className="cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors relative">
                    <Badge count={MOCK_NOTIFICATIONS.filter(n => !n.isRead).length} size="small" color="#ef4444" offset={[-2, 2]}>
                      <Bell className="w-[22px] h-[22px] text-gray-700" />
                    </Badge>
                  </div>
                </Dropdown>

                <Dropdown menu={{ items: userMenu }} placement="bottomRight" trigger={['click']}>
                  <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 md:pr-3 rounded-full transition-colors border border-transparent hover:border-gray-200">
                    <Avatar 
                      src={userInfo?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo?.fullName || userInfo?.username || "User")}&background=1b2a4a&color=fff`} 
                      size="default" 
                      className="bg-blue-100 border border-gray-200 shadow-sm" 
                    />
                    <span className="hidden md:block font-medium text-gray-700 text-sm">{userInfo?.fullName || userInfo?.username}</span>
                  </div>
                </Dropdown>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button
                  onClick={onLoginClick}
                  className="text-black font-bold py-2 px-5 rounded-md flex items-center gap-2 transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  <a className="hover:text-blue-500 font-bold">ĐĂNG NHẬP</a>
                </button>
              </div>)}
        </div>

      </div>
    </>
  );
};

export default Header;