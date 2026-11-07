import React, { useState, useEffect, useRef } from 'react';
import { Badge, Dropdown, Avatar, Tag, Modal, Spin } from 'antd';
import { useAuth } from '../../auth/authProvider';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserCircle, CalendarCheck, FileText, LogOut, Search, X } from 'lucide-react';
import productApi from '../../service/api/productApi';

const ShopHeader = ({ onLoginClick, onRegisterClick, onCartClick, cartCount }) => {
  const { authenticated, userInfo, logout, openLoginModal } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchContainerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync search value when URL search param changes
  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearchValue(q);
  }, [searchParams]);

  // Click outside to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch product suggestions on typing
  useEffect(() => {
    const query = searchValue.trim();
    if (!query) {
      setSuggestions([]);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const res = await productApi.getProducts({ search: query, size: 6 });
        setSuggestions(res.content || []);
      } catch (err) {
        console.error('Failed to load search suggestions:', err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 250);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchValue]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const query = searchValue.trim();
    setShowSuggestions(false);
    setMobileSearchOpen(false);
    if (!query) {
      navigate('/shop');
    } else {
      navigate(`/shop?search=${encodeURIComponent(query)}`);
    }
  };

  const handleSelectProduct = (product) => {
    setShowSuggestions(false);
    setMobileSearchOpen(false);
    navigate(`/shop/product/${product.id}`);
  };

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

  const formatPrice = (val) => new Intl.NumberFormat('vi-VN').format(val || 0);

  return (
    <div className="w-full bg-white text-black shadow-md relative">
      <div className="max-w-[1280px] mx-auto px-4 flex items-center justify-between h-16 gap-4">
        <div className="flex items-center gap-6">
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 shrink-0"
          >
            <span className="text-2xl font-black italic tracking-wider text-black">BachBarber</span>
            <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded font-bold uppercase">SHOP</span>
          </div>

          {/* Desktop Search Bar with Autocomplete Suggestions */}
          <div ref={searchContainerRef} className="hidden lg:flex items-center relative w-80 xl:w-96">
            <form onSubmit={handleSearchSubmit} className="w-full flex items-center relative">
              <input
                type="text"
                value={searchValue}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  setShowSuggestions(true);
                }}
                placeholder="Tìm sản phẩm sáp, pomade, gôm xịt..."
                className="w-full bg-gray-50 border border-gray-300 hover:border-gray-400 focus:border-blue-500 text-gray-800 text-sm rounded-full py-2 pl-4 pr-10 focus:outline-none focus:bg-white transition-all shadow-inner"
              />
              <button type="submit" aria-label="Tìm kiếm" className="absolute right-3 text-gray-500 hover:text-blue-600 cursor-pointer">
                <Search size={16} />
              </button>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && searchValue.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[120] divide-y divide-gray-100">
                <div className="px-3.5 py-2 bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Sản phẩm gợi ý</span>
                  {loadingSuggestions ? (
                    <Spin size="small" />
                  ) : (
                    <span className="text-[10px] text-blue-600 font-semibold">{suggestions.length} sản phẩm</span>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {suggestions.length > 0 ? (
                    suggestions.map((p) => (
                      <div
                        key={p.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectProduct(p);
                        }}
                        className="px-3.5 py-2.5 hover:bg-blue-50/70 cursor-pointer flex items-center gap-3 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                          <img
                            src={p.imageUrl || p.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=100&auto=format&fit=crop'}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 truncate mb-0.5">
                            {p.name}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-red-600">
                              {formatPrice(p.price)}đ
                            </span>
                            {p.soldCount > 0 && (
                              <span className="text-[10px] text-gray-400">Đã bán {p.soldCount}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    !loadingSuggestions && (
                      <div className="p-4 text-center text-xs text-gray-400">
                        Không tìm thấy sản phẩm nào khớp với "{searchValue}"
                      </div>
                    )
                  )}
                </div>

                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSearchSubmit();
                  }}
                  className="w-full py-2 bg-gray-50 hover:bg-blue-50 text-center text-xs font-bold text-blue-600 transition-colors cursor-pointer"
                >
                  Xem tất cả kết quả cho "{searchValue}" →
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Mobile search toggle */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="Tìm kiếm sản phẩm"
            className="lg:hidden p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-all cursor-pointer"
          >
            <Search size={20} />
          </button>

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
              className="text-black font-bold py-2 px-3 sm:px-4 rounded-xl flex items-center gap-1.5 sm:gap-2 hover:bg-gray-100 hover:text-blue-600 transition-all duration-200 cursor-pointer text-xs sm:text-sm"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              <span>ĐĂNG NHẬP</span>
            </button>
          )}

          <div
            onClick={onCartClick}
            className="flex items-center relative cursor-pointer px-2 transition-colors"
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

      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <div className="lg:hidden absolute inset-0 bg-white z-[130] px-4 py-2 flex flex-col justify-start shadow-md">
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
              <input
                type="text"
                autoFocus
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Tìm sản phẩm sáp, pomade, gôm xịt..."
                className="w-full bg-gray-100 text-gray-800 text-sm pl-4 pr-10 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" aria-label="Tìm kiếm" className="absolute right-3 text-gray-500">
                <Search size={16} />
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

          {searchValue.trim() && suggestions.length > 0 && (
            <div className="mt-2 bg-white rounded-xl border border-gray-100 overflow-y-auto max-h-60 divide-y divide-gray-50">
              {suggestions.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectProduct(p)}
                  className="px-3 py-2 flex items-center justify-between text-xs hover:bg-blue-50"
                >
                  <span className="font-semibold text-gray-800 truncate">{p.name}</span>
                  <span className="font-bold text-red-600 shrink-0 ml-2">{formatPrice(p.price)}đ</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShopHeader;