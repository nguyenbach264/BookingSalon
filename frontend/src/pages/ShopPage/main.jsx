import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Select, Empty, message, Skeleton, Tag, Button, Spin } from 'antd';
import { FilterOutlined, AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { addToCart, updateQuantity, removeItem } from '../../redux/cartSlice';
import { useAuth } from '../../auth/authProvider';
import productApi from '../../service/api/productApi';
import Footer from '../components/Footer';
import CartPage from './CartPage';
import ShopLayoutHeader from '../components/ShopLayoutHeader';
import ProductCard from './ProductCard';

const PAGE_SIZE = 15; // 3 hàng x 5 sản phẩm = 15 sản phẩm / trang

const PRICE_RANGES = {
  ALL: { label: 'Tất cả mức giá', min: undefined, max: undefined },
  UNDER_100K: { label: 'Dưới 100.000đ', min: undefined, max: 100000 },
  '100K_300K': { label: '100.000đ - 300.000đ', min: 100000, max: 300000 },
  '300K_500K': { label: '300.000đ - 500.000đ', min: 300000, max: 500000 },
  OVER_500K: { label: 'Trên 500.000đ', min: 500000, max: undefined },
};

const Shop = ({ onAddToCart, onBuyNow }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = (searchParams.get('search') || '').trim();

  const [categories, setCategories] = useState([]);
  const [activeCategorySlug, setActiveCategorySlug] = useState('ALL');
  const [priceRangeKey, setPriceRangeKey] = useState('ALL');
  const [sortBy, setSortBy] = useState('rating');

  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');

  // Đọc chỉ số trang ban đầu từ URL Hash (VD: #o=1&pi=3) hoặc query param
  const getInitialPageIndex = () => {
    const hash = window.location.hash;
    const matchHash = hash.match(/pi=(\d+)/);
    if (matchHash) return parseInt(matchHash[1], 10) || 1;
    const piParam = searchParams.get('pi');
    if (piParam) return parseInt(piParam, 10) || 1;
    return 1;
  };

  // 1. Tải danh mục sản phẩm lúc khởi tạo
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await productApi.getProductCategories();
        setCategories(data || []);
      } catch (err) {
        console.error('Failed to load product categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // 2. Fetch danh sách sản phẩm trang đầu khi thay đổi bộ lọc (Category, Price, Sort, Search)
  const fetchInitialProducts = useCallback(async () => {
    setLoading(true);
    const initialPi = getInitialPageIndex();
    // Nếu URL ban đầu có pi > 1 (ví dụ người dùng refresh hoặc dán link #o=1&pi=3)
    const fetchSize = PAGE_SIZE * initialPi;

    try {
      const selectedPrice = PRICE_RANGES[priceRangeKey] || PRICE_RANGES.ALL;
      const params = {
        page: 0,
        size: fetchSize,
        sortBy: sortBy,
      };

      if (activeCategorySlug && activeCategorySlug !== 'ALL') {
        params.categorySlug = activeCategorySlug;
      }
      if (selectedPrice.min !== undefined) {
        params.minPrice = selectedPrice.min;
      }
      if (selectedPrice.max !== undefined) {
        params.maxPrice = selectedPrice.max;
      }
      if (urlSearch) {
        params.search = urlSearch;
      }

      const res = await productApi.getProducts(params);
      setProducts(res.content || []);
      setTotalProducts(res.totalElements || 0);
      setCurrentPage(initialPi);
    } catch (err) {
      console.error('Failed to load products:', err);
      message.error('Không thể tải danh sách sản phẩm. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  }, [activeCategorySlug, priceRangeKey, sortBy, urlSearch]);

  useEffect(() => {
    fetchInitialProducts();
  }, [fetchInitialProducts]);

  // 3. Xử lý tải thêm sản phẩm khi click nút "Xem thêm ... sản phẩm"
  const handleLoadMore = async () => {
    if (loadingMore || products.length >= totalProducts) return;
    const nextPage = currentPage + 1;
    setLoadingMore(true);

    try {
      const selectedPrice = PRICE_RANGES[priceRangeKey] || PRICE_RANGES.ALL;
      const params = {
        page: nextPage - 1, // Spring Data dùng 0-indexed page
        size: PAGE_SIZE,
        sortBy: sortBy,
      };

      if (activeCategorySlug && activeCategorySlug !== 'ALL') {
        params.categorySlug = activeCategorySlug;
      }
      if (selectedPrice.min !== undefined) {
        params.minPrice = selectedPrice.min;
      }
      if (selectedPrice.max !== undefined) {
        params.maxPrice = selectedPrice.max;
      }
      if (urlSearch) {
        params.search = urlSearch;
      }

      const res = await productApi.getProducts(params);
      const newItems = res.content || [];
      setProducts((prev) => [...prev, ...newItems]);
      setCurrentPage(nextPage);

      // Cập nhật URL Hash theo chuẩn giao diện như Thế Giới Di Động (#o=1&pi=X)
      window.location.hash = `o=1&pi=${nextPage}`;
    } catch (err) {
      console.error('Failed to load more products:', err);
      message.error('Không thể tải thêm sản phẩm!');
    } finally {
      setLoadingMore(false);
    }
  };

  // 4. Các handler thay đổi bộ lọc
  const handleCategorySelect = (slug) => {
    setActiveCategorySlug(slug);
    setCurrentPage(1);
    window.location.hash = 'o=1&pi=1';
  };

  const handlePriceRangeChange = (value) => {
    setPriceRangeKey(value);
    setCurrentPage(1);
    window.location.hash = 'o=1&pi=1';
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
    window.location.hash = 'o=1&pi=1';
  };

  const handleResetFilters = () => {
    setActiveCategorySlug('ALL');
    setPriceRangeKey('ALL');
    setSortBy('rating');
    setCurrentPage(1);
    window.location.hash = 'o=1&pi=1';
    if (urlSearch) {
      setSearchParams({});
    }
  };

  const handleClearSearch = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('search');
    setSearchParams(nextParams);
    setCurrentPage(1);
    window.location.hash = 'o=1&pi=1';
  };

  const isFilterActive =
    activeCategorySlug !== 'ALL' ||
    priceRangeKey !== 'ALL' ||
    Boolean(urlSearch);

  const currentCategoryName =
    activeCategorySlug === 'ALL'
      ? 'Tất cả sản phẩm'
      : categories.find((c) => c.slug === activeCategorySlug)?.name || 'Sản phẩm';

  const remainingCount = Math.max(0, totalProducts - products.length);

  return (
    <div className="w-full flex-1 flex flex-col">
      <main className="w-full flex-1">
        <div className="max-w-[1280px] mx-auto px-4 py-6">
          {/* ── HERO BANNER PROMOTION ── */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 sm:p-7 mb-6 shadow-md border border-slate-800">
            <div className="relative z-10 max-w-3xl">
              <span className="inline-block px-3 py-1 bg-amber-400 text-slate-900 font-black text-xs uppercase tracking-wider rounded-full mb-2.5 shadow-xs">
                💈 BachBarber Pro Salon Store
              </span>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight mb-2">
                Sản phẩm tạo kiểu & chăm sóc tóc nam Barber chính hãng
              </h1>
              <p className="text-blue-100 text-xs sm:text-sm mb-3.5 leading-relaxed">
                Hơn 200+ dòng sáp vuốt tóc, clay, pomade, gôm xịt, dầu gội da đầu & phụ kiện barber nhập khẩu chuẩn salon. Tư vấn kiểu tóc miễn phí từ Stylist hàng đầu.
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                  ⚡ Freeship đơn từ 500k
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                  🛡️ 100% Nhập khẩu chính hãng
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                  🔄 Đổi trả trong 7 ngày
                </span>
              </div>
            </div>
          </div>

          {/* ── BỘ LỌC ĐẶT Ở PHÍA TRÊN (TOP FILTER BAR) ── */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-gray-200 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Nhóm bộ lọc: Danh mục, Khoảng giá */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mr-1">
                  <FilterOutlined className="text-[#60a5fa]" /> Bộ lọc:
                </span>

                {/* 1. Lọc theo Danh mục sản phẩm */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-600 font-medium">Danh mục:</span>
                  <Select
                    value={activeCategorySlug}
                    onChange={handleCategorySelect}
                    style={{ minWidth: 170 }}
                    className="rounded-lg text-xs"
                    options={[
                      { value: 'ALL', label: `📦 Tất cả danh mục (${totalProducts || 0})` },
                      ...categories.map((c) => ({
                        value: c.slug,
                        label: `${c.name} ${c.productCount ? `(${c.productCount})` : ''}`,
                      })),
                    ]}
                  />
                </div>

                {/* 2. Lọc theo Khoảng giá */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-600 font-medium">Khoảng giá:</span>
                  <Select
                    value={priceRangeKey}
                    onChange={handlePriceRangeChange}
                    style={{ minWidth: 170 }}
                    className="rounded-lg text-xs"
                    options={[
                      { value: 'ALL', label: '💰 Tất cả mức giá' },
                      { value: 'UNDER_100K', label: 'Dưới 100.000đ' },
                      { value: '100K_300K', label: '100.000đ - 300.000đ' },
                      { value: '300K_500K', label: '300.000đ - 500.000đ' },
                      { value: 'OVER_500K', label: 'Trên 500.000đ' },
                    ]}
                  />
                </div>

                {/* Nút Xóa bộ lọc nếu đang áp dụng lọc */}
                {isFilterActive && (
                  <Button
                    size="small"
                    onClick={handleResetFilters}
                    className="text-xs text-red-500 hover:text-red-700 border-red-200 hover:border-red-400 rounded-lg cursor-pointer"
                  >
                    Xóa tất cả bộ lọc
                  </Button>
                )}
              </div>

              {/* Sắp xếp và chuyển đổi chế độ xem */}
              <div className="flex items-center gap-3 ml-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-600 font-medium">Sắp xếp:</span>
                  <Select
                    value={sortBy}
                    onChange={handleSortChange}
                    style={{ width: 170 }}
                    className="rounded-lg text-xs"
                    options={[
                      { value: 'rating', label: '⭐ Đánh giá cao nhất' },
                      { value: 'price_asc', label: '💵 Giá thấp đến cao' },
                      { value: 'price_desc', label: '💎 Giá cao xuống thấp' },
                      { value: 'sold_desc', label: '🔥 Bán chạy nhất' },
                      { value: 'createdAt', label: '🆕 Mới nhất' },
                    ]}
                  />
                </div>

                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-white shadow-xs text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="Chế độ lưới"
                  >
                    <AppstoreOutlined className="text-base" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-white shadow-xs text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="Chế độ danh sách"
                  >
                    <UnorderedListOutlined className="text-base" />
                  </button>
                </div>
              </div>
            </div>

            {/* Thanh chọn nhanh danh mục (Category Pills) ngay bên dưới filter */}
            <div className="flex items-center gap-2 overflow-x-auto pt-3 mt-3 border-t border-gray-100 scrollbar-hide">
              <button
                onClick={() => handleCategorySelect('ALL')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategorySlug === 'ALL'
                    ? 'bg-[#60a5fa] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tất cả ({totalProducts})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id || c.slug}
                  onClick={() => handleCategorySelect(c.slug)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeCategorySlug === c.slug
                      ? 'bg-[#60a5fa] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {c.name} {c.productCount ? `(${c.productCount})` : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filter Chips */}
          {isFilterActive && (
            <div className="flex flex-wrap items-center gap-2 mb-4 p-2.5 bg-blue-50/70 rounded-xl border border-blue-100">
              <span className="text-xs font-semibold text-gray-500">Đang lọc theo:</span>
              {activeCategorySlug !== 'ALL' && (
                <Tag
                  closable
                  onClose={() => handleCategorySelect('ALL')}
                  color="blue"
                  className="rounded-lg text-xs py-0.5"
                >
                  Danh mục: {currentCategoryName}
                </Tag>
              )}
              {priceRangeKey !== 'ALL' && (
                <Tag
                  closable
                  onClose={() => handlePriceRangeChange('ALL')}
                  color="purple"
                  className="rounded-lg text-xs py-0.5"
                >
                  Giá: {PRICE_RANGES[priceRangeKey]?.label}
                </Tag>
              )}
              {urlSearch && (
                <Tag
                  closable
                  onClose={handleClearSearch}
                  color="cyan"
                  className="rounded-lg text-xs py-0.5"
                >
                  Từ khóa: "{urlSearch}"
                </Tag>
              )}
              <button
                onClick={handleResetFilters}
                className="text-xs text-blue-600 font-semibold hover:underline ml-auto cursor-pointer"
              >
                Xóa tất cả
              </button>
            </div>
          )}

          {/* Thông tin số lượng hiển thị */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600 text-xs sm:text-sm mb-0">
              Hiển thị <span className="font-bold text-gray-900">{products.length}</span> trên{' '}
              <span className="font-bold text-gray-900">{totalProducts}</span> sản phẩm
              {urlSearch && (
                <span className="text-blue-600 font-medium ml-1">khớp với "{urlSearch}"</span>
              )}
            </p>
          </div>

          {/* ── GRID SẢN PHẨM: 5 ITEMS TRÊN MÀN HÌNH BÌNH THƯỜNG & RESPONSIVE ── */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3.5 sm:gap-4 md:gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 h-80">
                  <Skeleton.Image className="w-full h-44 mb-3 rounded-lg" active />
                  <Skeleton active paragraph={{ rows: 2 }} title={{ width: '80%' }} />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-xs">
              <Empty description="Không tìm thấy sản phẩm nào phù hợp với bộ lọc đã chọn">
                <button
                  onClick={handleResetFilters}
                  className="mt-2 px-5 py-2 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  Bỏ bộ lọc và xem tất cả
                </button>
              </Empty>
            </div>
          ) : (
            <>
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3.5 sm:gap-4 md:gap-5'
                    : 'grid grid-cols-1 gap-4'
                }
              >
                {products.map((product) => (
                  <div key={product.id} className="h-full">
                    <ProductCard
                      product={product}
                      onAddToCart={() => onAddToCart(product)}
                      onBuyNow={() => onBuyNow(product)}
                    />
                  </div>
                ))}
              </div>

              {/* ── NÚT "XEM THÊM ... SẢN PHẨM ∨" (LOAD MORE) CHUẨN THẾ GIỚI DI ĐỘNG ── */}
              {remainingCount > 0 ? (
                <div className="mt-10 mb-8 flex flex-col items-center justify-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="px-8 py-3 bg-white hover:bg-blue-50 text-blue-600 hover:text-blue-700 font-bold text-sm rounded-xl border border-blue-400 hover:border-blue-500 shadow-sm transition-all duration-200 flex items-center gap-2 cursor-pointer group active:scale-95 disabled:opacity-70"
                  >
                    {loadingMore ? (
                      <>
                        <Spin size="small" />
                        <span>Đang tải thêm sản phẩm...</span>
                      </>
                    ) : (
                      <>
                        <span>Xem thêm {remainingCount} sản phẩm</span>
                        <span className="text-blue-500 font-black text-sm group-hover:translate-y-0.5 transition-transform">
                          ∨
                        </span>
                      </>
                    )}
                  </button>
                  <span className="text-xs text-gray-400 mt-2">
                    Đã hiển thị {products.length} / {totalProducts} sản phẩm
                  </span>
                </div>
              ) : (
                products.length > 0 && (
                  <div className="mt-10 mb-8 text-center text-xs text-gray-400 font-medium">
                    ✓ Đã hiển thị tất cả {totalProducts} sản phẩm
                  </div>
                )
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default function ShopPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const cartItems = useSelector((state) => state.cart.items);
  const { authenticated, openLoginModal, openRegisterModal } = useAuth();
  const [isCartVisible, setIsCartVisible] = useState(false);

  const handleUpdateQuantity = (id, delta) => {
    dispatch(
      updateQuantity({
        id,
        delta,
      })
    );
  };

  const handleRemoveItem = (id) => {
    dispatch(removeItem(id));
  };

  const handleAddToCart = (product) => {
    const numericPrice =
      typeof product.price === 'number'
        ? product.price
        : parseInt(String(product.price).replace(/\./g, ''), 10) || 0;

    dispatch(
      addToCart({
        id: product.id,
        name: product.name,
        price: numericPrice,
        image: product.imageUrl || product.image,
      })
    );

    messageApi.success({
      content: `Đã thêm "${product.name}" vào giỏ hàng`,
      duration: 2,
    });
  };

  const handleBuyNow = (product) => {
    if (product?.id) {
      navigate(`/shop/product/${product.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 flex flex-col">
      {contextHolder}

      <ShopLayoutHeader
        onLoginClick={() => openLoginModal()}
        onRegisterClick={() => openRegisterModal()}
        onCartClick={() => setIsCartVisible(true)}
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
      />

      <CartPage
        visible={isCartVisible}
        onClose={() => setIsCartVisible(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => {
          setIsCartVisible(false);
          if (!authenticated) {
            openLoginModal(
              'Quý khách cần đăng nhập tài khoản để tiến hành thanh toán đơn hàng!',
              '/checkout'
            );
            return;
          }
          navigate('/checkout');
        }}
      />

      <div className="pt-[108px] flex-1 flex flex-col">
        <Shop onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} />
      </div>

      <Footer />
    </div>
  );
}