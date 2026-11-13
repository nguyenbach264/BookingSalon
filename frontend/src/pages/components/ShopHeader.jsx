import React, { useState, useEffect, useRef } from 'react';
import { Badge, Dropdown, Avatar, Tag, Modal, Spin, Drawer } from 'antd';
import { useAuth } from '../../auth/authProvider';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserCircle, CalendarCheck, FileText, LogOut, Search, X, Menu, Home, Scissors, ShoppingBag, MapPin, Gift, Star, Phone } from 'lucide-react';
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const searchContainerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Auto-close on navigate
  useEffect(() => {
    setMobileNavOpen(false);
    setMobileSearchOpen(false);
  }, [navigate]);

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
    <div
      className="w-full text-white shadow-md relative z-50 transition-colors"
      style={{ backgroundColor: 'var(--primary-color, #0099FF)' }}
    >
      <div className="max-w-[1280px] mx-auto px-4 flex items-center justify-between h-12 gap-4">
        <div className="flex items-center gap-2 sm:gap-6">
          {/* Nút điều hướng ẩn Mobile */}
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
            className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 shrink-0"
          >
            <span className="text-2xl font-black italic tracking-wider text-white">BachBarber</span>
            <span className="text-xs bg-white text-[#0099FF] px-2 py-0.5 rounded font-black uppercase shadow-xs" style={{ color: 'var(--primary-color, #0099FF)' }}>SHOP</span>
          </div>

          {/* Desktop Search Bar with Autocomplete Suggestions */}
          <div ref={searchContainerRef} className="hidden lg:flex items-center relative z-50 w-80 xl:w-96">
            <form onSubmit={handleSearchSubmit} className="w-full flex items-center relative group/form">
              <input
                type="text"
                value={searchValue}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  setShowSuggestions(true);
                }}
                placeholder="Tìm sản phẩm sáp, pomade, gôm xịt..."
                className="w-full bg-white/20 border border-white/30 hover:border-white focus:border-white text-white group-focus-within/form:text-gray-900 text-sm rounded-full py-2 pl-4 pr-10 focus:outline-none focus:bg-white transition-all shadow-inner placeholder:text-white/80 group-focus-within/form:placeholder:text-gray-400"
              />
              <button type="submit" aria-label="Tìm kiếm" className="absolute right-3 text-white group-focus-within/form:text-[#0099FF] cursor-pointer" style={{ color: 'inherit' }}>
                <Search size={16} />
              </button>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && searchValue.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[120] divide-y divide-gray-100 text-gray-800">
                <div className="px-3.5 py-2 bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Sản phẩm gợi ý</span>
                  {loadingSuggestions ? (
                    <Spin size="small" />
                  ) : (
                    <span className="text-[10px] text-[#0099FF] font-semibold" style={{ color: 'var(--primary-color, #0099FF)' }}>{suggestions.length} sản phẩm</span>
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
                          <p className="text-xs font-semibold text-gray-900 group-hover:text-[#0099FF] truncate mb-0.5" style={{ color: 'inherit' }}>
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
                  className="w-full py-2 bg-gray-50 hover:bg-blue-50 text-center text-xs font-bold text-[#0099FF] transition-colors cursor-pointer"
                  style={{ color: 'var(--primary-color, #0099FF)' }}
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
            className="lg:hidden p-2 rounded-full hover:bg-white/10 text-white transition-all cursor-pointer"
          >
            <Search size={20} />
          </button>

          {authenticated ? (
            <Dropdown menu={{ items: userMenu }} placement="bottomRight" arrow trigger={['click']}>
              <div className="flex items-center gap-2.5 cursor-pointer py-1 px-2.5 rounded-full hover:bg-white/10 transition-colors">
                <Avatar
                  size={34}
                  src={userInfo?.avatarUrl}
                  className="bg-white text-[#0099FF] font-bold"
                >
                  {(userInfo?.fullName || userInfo?.username || 'U')[0].toUpperCase()}
                </Avatar>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-white leading-tight">
                    {userInfo?.fullName || userInfo?.username}
                  </span>
                  <span className="text-[10px] text-white/80 font-semibold">Tài khoản</span>
                </div>
              </div>
            </Dropdown>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-white text-[#0099FF] font-bold py-1.5 px-3 sm:px-4 rounded-xl flex items-center gap-1.5 sm:gap-2 hover:bg-white/90 transition-all duration-200 cursor-pointer text-xs sm:text-sm shadow-xs"
              style={{ color: 'var(--primary-color, #0099FF)' }}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              <span>ĐĂNG NHẬP</span>
            </button>
          )}

          <div
            onClick={onCartClick}
            className="flex items-center relative cursor-pointer px-2 transition-colors hover:bg-white/10 py-1.5 rounded-full"
          >
            <span className="flex items-center group cursor-pointer text-white">
              <Badge
                count={cartCount} size="small" offset={[2, 0]}
              >
                <svg
                  className="w-5 h-5 text-white transition-colors"
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

      {/* ── MOBILE NAVIGATION DRAWER (Ant Design Portal - 100% Responsive) ─────────────────────────────────── */}
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
                    handleLogin();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-all"
                  style={{ backgroundColor: 'var(--primary-color, #0099FF)' }}
                >
                  <UserCircle size={16} />
                  <span>Đăng nhập / Đăng ký</span>
                </button>
              )}
            </div>

            <div className="p-3 space-y-1">
              {[
                { label: 'Trang chủ', path: '/', icon: <Home size={18} /> },
                { label: 'Dịch vụ Salon', path: '/service', icon: <Scissors size={18} /> },
                { label: 'Cửa hàng mỹ phẩm', path: '/shop', icon: <ShoppingBag size={18} /> },
                { label: 'Hệ thống Salon', path: '/salons', icon: <MapPin size={18} /> },
                { label: 'Ưu đãi & Voucher', path: '/promotions', icon: <Gift size={18} />, badge: 'HOT' },
                { label: 'Về chúng tôi', path: '/about', icon: <Star size={18} /> },
              ].map((item) => {
                const active = item.path === '/shop';
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
    </div>
  );
};

export default ShopHeader;