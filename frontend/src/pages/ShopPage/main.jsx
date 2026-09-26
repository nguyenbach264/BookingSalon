import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Breadcrumb, Select, Spin, Empty, Pagination, message, Skeleton, Input, Tag } from 'antd';
import { SearchOutlined, AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom"; 
import { addToCart, updateQuantity, removeItem } from "../../redux/cartSlice";
import { useAuth } from '../../auth/authProvider';
import productApi from '../../service/api/productApi';
import FilterSidebar from './FilterSidebar';
import Footer from '../components/Footer';
import CartPage from './CartPage';
import ShopLayoutHeader from '../components/ShopLayoutHeader';
import ProductCard from './ProductCard';

const Shop = ({ onAddToCart, onBuyNow }) => {
  const [categories, setCategories] = useState([]);
  const [activeCategorySlug, setActiveCategorySlug] = useState('ALL');
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  
  const searchTimeoutRef = useRef(null);

  // Filters state
  const [filters, setFilters] = useState({
    minPrice: undefined,
    maxPrice: undefined,
    minRating: undefined,
    sortBy: 'rating',
    page: 0,
    size: 9,
    search: '',
  });

  // Load product categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await productApi.getProductCategories();
        setCategories(data || []);
      } catch (err) {
        console.error("Failed to load product categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products with current filters
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: filters.page,
        size: filters.size,
        sortBy: filters.sortBy,
      };

      if (activeCategorySlug && activeCategorySlug !== 'ALL') {
        params.categorySlug = activeCategorySlug;
      }
      if (filters.minPrice !== undefined) {
        params.minPrice = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        params.maxPrice = filters.maxPrice;
      }
      if (filters.minRating !== undefined) {
        params.minRating = filters.minRating;
      }
      if (filters.search) {
        params.search = filters.search; // Ensure backend supports 'search' or similar parameter
      }

      const res = await productApi.getProducts(params);
      setProducts(res.content || []);
      setTotalProducts(res.totalElements || 0);
    } catch (err) {
      console.error("Failed to load products:", err);
      message.error("Không thể tải danh sách sản phẩm. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  }, [activeCategorySlug, filters]);

  // Auto update products when category or filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCategorySelect = (slug) => {
    setActiveCategorySlug(slug);
    setFilters(prev => ({ ...prev, page: 0 }));
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 0, // Reset to first page on filter change
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      minPrice: undefined,
      maxPrice: undefined,
      minRating: undefined,
      sortBy: 'rating',
      page: 0,
      size: 9,
      search: '',
    });
    setActiveCategorySlug('ALL');
    setSearchText('');
  };

  const handleSortChange = (value) => {
    setFilters(prev => ({
      ...prev,
      sortBy: value,
      page: 0,
    }));
  };

  const handlePageChange = (page, pageSize) => {
    setFilters(prev => ({
      ...prev,
      page: page - 1,
      size: pageSize,
    }));
    window.scrollTo({ top: 150, behavior: 'smooth' });
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        search: value,
        page: 0
      }));
    }, 400);
  };

  const currentCategoryName = activeCategorySlug === 'ALL'
    ? 'Tất cả sản phẩm'
    : (categories.find(c => c.slug === activeCategorySlug)?.name || 'Sản phẩm');

  return (
    <div className="w-full flex-1 flex flex-col">
      <div className="w-full bg-gray-50 py-3 border-b border-gray-200">
        <div className="max-w-[1280px] mx-auto px-4">
          <Breadcrumb
            items={[
              { title: <span className="text-gray-500 cursor-pointer hover:text-blue-600 transition-colors">Trang chủ</span> },
              { title: <span className="text-gray-500 cursor-pointer hover:text-blue-600 transition-colors">Cửa hàng</span> },
              { title: <span className="text-gray-900 font-medium">{currentCategoryName}</span> }
            ]}
          />
        </div>
      </div>

      <main className="w-full flex-1">
        <div className="max-w-[1280px] mx-auto px-4 py-8">
          {/* ── HERO PROMOTIONAL BANNER ── */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 mb-6 shadow-md border border-slate-800">
            <div className="relative z-10 max-w-2xl">
              <span className="inline-block px-3 py-1 bg-amber-400 text-slate-900 font-black text-xs uppercase tracking-wider rounded-full mb-3 shadow-xs">
                💈 BachBarber Pro Salon Store
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
                Sản phẩm tạo kiểu & chăm sóc tóc nam Barber chính hãng
              </h2>
              <p className="text-blue-100 text-sm mb-4 leading-relaxed">
                Hơn 200+ dòng sáp vuốt tóc, clay, pomade, tinh dầu dưỡng râu, dầu gội da đầu & phụ kiện barber nhập khẩu chuẩn salon. Tư vấn kiểu tóc miễn phí từ Stylist hàng đầu.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                  ⚡ Freeship đơn từ 500k
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                  🛡️ 100% Nhập khẩu chính hãng
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                  🔄 Đổi trả trong 7 ngày
                </span>
              </div>
            </div>
          </div>

          {/* ── TRUST BADGES BAR ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-8">
            {[
              { icon: "⚡", title: "Giao hỏa tốc 2H", desc: "Nội thành nhận ngay trong ngày" },
              { icon: "🛡️", title: "Chính hãng 100%", desc: "Bảo đảm xuất xứ rõ ràng" },
              { icon: "🔄", title: "Đổi trả 7 ngày", desc: "Miễn phí đổi hàng nếu lỗi SX" },
              { icon: "💈", title: "Stylist tư vấn", desc: "Tư vấn sản phẩm chuẩn chất tóc" },
            ].map((badge, idx) => (
              <div key={idx} className="bg-white border border-gray-100 rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
                <span className="text-2xl flex-shrink-0">{badge.icon}</span>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-gray-800 mb-0.5 truncate">{badge.title}</p>
                  <p className="text-[11px] text-gray-400 mb-0 truncate">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-8 mt-2">
            <h1 className="text-2xl font-extrabold uppercase mb-4 text-gray-900 tracking-tight">
              {currentCategoryName}
            </h1>

            {/* Category horizontal tabs */}
            <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-8 border-b border-gray-200">
              <button
                onClick={() => handleCategorySelect('ALL')}
                className={`whitespace-nowrap pb-3 text-base font-semibold transition-all duration-300 relative ${
                  activeCategorySlug === 'ALL'
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Tất cả sản phẩm {totalProducts > 0 && `(${totalProducts})`}
                <div
                  className={`absolute bottom-0 left-0 h-0.5 bg-blue-600 transition-all duration-300 ${
                    activeCategorySlug === 'ALL' ? 'w-full' : 'w-0'
                  }`}
                />
              </button>

              {categories.map((category) => (
                <button
                  key={category.id || category.slug}
                  onClick={() => handleCategorySelect(category.slug)}
                  className={`whitespace-nowrap pb-3 text-base font-semibold transition-all duration-300 relative ${
                    activeCategorySlug === category.slug
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  {category.name} {category.productCount ? `(${category.productCount})` : ''}
                  <div
                    className={`absolute bottom-0 left-0 h-0.5 bg-blue-600 transition-all duration-300 ${
                      activeCategorySlug === category.slug ? 'w-full' : 'w-0'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Real-time Dynamic Filter Sidebar */}
            <FilterSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
            />

            {/* Product list section */}
            <div className="flex-1 w-full">
              {/* Active Filter Chips */}
              {(activeCategorySlug !== 'ALL' || filters.minPrice !== undefined || filters.maxPrice !== undefined || filters.minRating !== undefined || filters.search) && (
                <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-blue-50/70 rounded-xl border border-blue-100">
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
                  {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
                    <Tag
                      closable
                      onClose={() => handleFilterChange({ minPrice: undefined, maxPrice: undefined })}
                      color="purple"
                      className="rounded-lg text-xs py-0.5"
                    >
                      Giá: {filters.minPrice ? `${(filters.minPrice / 1000)}k` : '0đ'} - {filters.maxPrice ? `${(filters.maxPrice / 1000)}k` : 'Vô hạn'}
                    </Tag>
                  )}
                  {filters.minRating !== undefined && (
                    <Tag
                      closable
                      onClose={() => handleFilterChange({ minRating: undefined })}
                      color="gold"
                      className="rounded-lg text-xs py-0.5"
                    >
                      Từ {filters.minRating} ⭐ trở lên
                    </Tag>
                  )}
                  {filters.search && (
                    <Tag
                      closable
                      onClose={() => { setSearchText(''); handleFilterChange({ search: '' }); }}
                      color="cyan"
                      className="rounded-lg text-xs py-0.5"
                    >
                      Từ khóa: "{filters.search}"
                    </Tag>
                  )}
                  <button
                    onClick={handleResetFilters}
                    className="text-xs text-blue-600 font-semibold hover:underline ml-auto"
                  >
                    Xóa tất cả
                  </button>
                </div>
              )}

              {/* Search Bar */}
              <div className="mb-6">
                <Input
                  size="large"
                  placeholder="Tìm kiếm sản phẩm theo tên, công dụng, thương hiệu..."
                  prefix={<SearchOutlined className="text-gray-400" />}
                  value={searchText}
                  onChange={handleSearchChange}
                  className="rounded-xl"
                  allowClear
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <p className="text-gray-600 text-sm">
                  Hiển thị <span className="font-bold text-gray-900">{products.length}</span> / <span>{totalProducts} sản phẩm</span>
                </p>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium">Sắp xếp:</span>
                    <Select
                      value={filters.sortBy}
                      onChange={handleSortChange}
                      style={{ width: 170 }}
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
                      className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                      title="Chế độ lưới"
                    >
                      <AppstoreOutlined className="text-lg" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                      title="Chế độ danh sách"
                    >
                      <UnorderedListOutlined className="text-lg" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Product Grid or Loading or Empty */}
              {loading ? (
                <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-gray-100">
                      <Skeleton.Image className="w-full h-48 mb-4 rounded-lg" active />
                      <Skeleton active paragraph={{ rows: 2 }} title={{ width: '80%' }} />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-xs">
                  <Empty
                    description="Không tìm thấy sản phẩm nào phù hợp với bộ lọc đã chọn"
                  >
                    <button
                      onClick={handleResetFilters}
                      className="mt-2 px-5 py-2 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Bỏ bộ lọc và xem tất cả
                    </button>
                  </Empty>
                </div>
              ) : (
                <>
                  <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
                    {products.map(product => (
                      <div key={product.id} className={viewMode === 'list' ? 'flex items-center max-w-full' : ''}>
                        <ProductCard
                          product={product}
                          onAddToCart={() => onAddToCart(product)}
                          onBuyNow={() => onBuyNow(product)}
                        />
                      </div>
                    ))}
                  </div>

                  {totalProducts > filters.size && (
                    <div className="mt-10 flex justify-center">
                      <Pagination
                        current={filters.page + 1}
                        pageSize={filters.size}
                        total={totalProducts}
                        onChange={handlePageChange}
                        showSizeChanger={false}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
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
    const numericPrice = typeof product.price === 'number'
      ? product.price
      : parseInt(String(product.price).replace(/\./g, ""), 10) || 0;

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
    handleAddToCart(product);
    setIsCartVisible(true);
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
            openLoginModal('Quý khách cần đăng nhập tài khoản để tiến hành thanh toán đơn hàng!', '/checkout');
            return;
          }
          navigate("/checkout");
        }}
      />

      <div className="pt-[108px] flex-1 flex flex-col">
        <Shop
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
        />
      </div>

      <Footer />
    </div>
  );
}