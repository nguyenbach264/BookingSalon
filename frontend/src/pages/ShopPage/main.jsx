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

// Tính số cột hiển thị theo chuẩn Tailwind của grid:
// grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6
const getGridColumns = (width) => {
  if (width >= 1024) return 6; // lg, xl
  if (width >= 768) return 4;  // md
  if (width >= 640) return 3;  // sm
  return 2;                    // mobile
};

// Tính batchSize là BỘI SỐ của số cột trên mỗi hàng để mỗi hàng luôn được lấp đầy hoàn chỉnh:
// - Màn lg/xl (6 cột): load 18 sản phẩm (3 hàng đầy x 6 item)
// - Màn md (4 cột): load 16 sản phẩm (4 hàng đầy x 4 item)
// - Màn sm (3 cột): load 15 sản phẩm (5 hàng đầy x 3 item)
// - Màn mobile (2 cột): load 12 sản phẩm (6 hàng đầy x 2 item)
// Chỉ có thể khuyết ở hàng cuối cùng khi đã tải HẾT sạch sản phẩm trong kho.
const getBatchSize = (cols) => {
  switch (cols) {
    case 6:
      return 18;
    case 4:
      return 16;
    case 3:
      return 15;
    case 2:
      return 12;
    default:
      return cols * 3;
  }
};

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

  // Responsive column count & multiple-of-columns batch size
  const [columns, setColumns] = useState(() =>
    typeof window !== 'undefined' ? getGridColumns(window.innerWidth) : 6
  );

  useEffect(() => {
    const handleResize = () => {
      const currentCols = getGridColumns(window.innerWidth);
      setColumns((prev) => (prev !== currentCols ? currentCols : prev));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const batchSize = useMemo(() => getBatchSize(columns), [columns]);

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
    const fetchSize = batchSize * initialPi;

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
  }, [activeCategorySlug, batchSize, priceRangeKey, sortBy, urlSearch]);

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
        size: batchSize,
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
      // Deduplicate items bảo đảm không bao giờ lặp sản phẩm giữa các đợt load
      setProducts((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const uniqueNewItems = newItems.filter((item) => !existingIds.has(item.id));
        return [...prev, ...uniqueNewItems];
      });
      setCurrentPage(nextPage);

      // Cập nhật URL Hash theo chuẩn giao diện (#o=1&pi=X)
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
  const nextLoadCount = Math.min(batchSize, remainingCount);


  return (
    <div className="w-full bg-[#f8fafc] min-h-screen">
      <main className="w-full">
        <div className="max-w-[1360px] mx-auto px-4 py-6">
          {/* ── Breadcrumb & Title (Mockup: media_1791826579236_04693605.jpg) ── */}
          <div className="mb-4">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
              <span>Trang chủ</span>
              <span>›</span>
              <span>Cửa hàng</span>
              <span>›</span>
              <span className="text-gray-600 font-medium">Sản phẩm</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-3">
              Cửa Hàng Grooming
            </h1>

            {/* Thanh chọn nhanh danh mục (Category Pills) - Chuẩn Mockup đặt ngay dưới tiêu đề */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => handleCategorySelect('ALL')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeCategorySlug === 'ALL'
                      ? 'bg-[#60a5fa] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tất cả
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id || c.slug}
                    onClick={() => handleCategorySelect(c.slug)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      activeCategorySlug === c.slug
                        ? 'bg-[#60a5fa] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Sắp xếp và bộ lọc nhanh bên phải */}
              <div className="flex items-center gap-2 ml-auto">
                <Select
                  value={priceRangeKey}
                  onChange={handlePriceRangeChange}
                  size="small"
                  style={{ width: 150 }}
                  className="rounded-lg text-xs"
                  options={[
                    { value: 'ALL', label: '💰 Mọi mức giá' },
                    { value: 'UNDER_100K', label: 'Dưới 100k' },
                    { value: '100K_300K', label: '100k - 300k' },
                    { value: '300K_500K', label: '300k - 500k' },
                    { value: 'OVER_500K', label: 'Trên 500k' },
                  ]}
                />

                <Select
                  value={sortBy}
                  onChange={handleSortChange}
                  size="small"
                  style={{ width: 150 }}
                  className="rounded-lg text-xs"
                  options={[
                    { value: 'rating', label: '⭐ Đánh giá cao' },
                    { value: 'price_asc', label: '💵 Giá thấp → cao' },
                    { value: 'price_desc', label: '💎 Giá cao → thấp' },
                    { value: 'sold_desc', label: '🔥 Bán chạy' },
                    { value: 'createdAt', label: '🆕 Mới nhất' },
                  ]}
                />

                <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-white shadow-xs text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="Chế độ lưới"
                  >
                    <AppstoreOutlined className="text-sm" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-white shadow-xs text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="Chế độ danh sách"
                  >
                    <UnorderedListOutlined className="text-sm" />
                  </button>
                </div>
              </div>
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

          {/* ── GRID SẢN PHẨM: 6 CỘT CHUẨN MOCKUP ── */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-3 sm:gap-3.5">
              {Array.from({ length: batchSize }).map((_, i) => (
                <div key={i} className="bg-white p-3 rounded-2xl border border-gray-100 h-72">
                  <Skeleton.Image className="w-full h-36 mb-3 rounded-xl" active />
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
                    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-3 sm:gap-3.5'
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
                        <span>Xem thêm {nextLoadCount} sản phẩm</span>
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