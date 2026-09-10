import React, { useState } from 'react';
import { Breadcrumb, Select, Rate, message } from 'antd';
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom"; 
import { addToCart, updateQuantity, removeItem, } from "../../redux/cartSlice";
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import FilterSidebar from './FilterSidebar';
import Footer from '../components/Footer';
import CartPage from './CartPage';
import ShopLayoutHeader from '../components/ShopLayoutHeader';
import ProductCard from './ProductCard';

const MOCK_CATEGORIES = [
  'Tất cả',
  'Tạo màu cho tóc',
  'Máy sấy tóc',
  'Sáp vuốt tóc',
  'Pre Styling',
  'Gôm giữ nếp'
];

const MOCK_PRODUCTS = [
  {
    id: 1,
    name: 'Sáp Vuốt Tóc Nam Kevin Murphy Rough Rider Không...',
    price: '378.000',
    oldPrice: '895.000',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1597354315366-eb1d0728c11a?w=400&auto=format&fit=crop&q=80',
    tag: 'BÁN CHẠY'
  },
  {
    id: 2,
    name: 'Sáp Vuốt Tóc Glanzen Clay Wax - Giữ Nếp Tới 12 Giờ',
    price: '199.000',
    oldPrice: '279.000',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&auto=format&fit=crop&q=80',
    tag: 'HOT'
  },
  {
    id: 3,
    name: 'Sáp Vuốt Tóc Nam 30shine Phân Phối Chính Hãng...',
    price: '390.000',
    oldPrice: '',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1585751119414-ef2636f9aede?w=400&auto=format&fit=crop&q=80',
    tag: 'CHÍNH HÃNG'
  },
  {
    id: 4,
    name: 'Sáp Tạo Kiểu Cứng Vừa Dry Paste Paul Mitchell',
    price: '719.000',
    oldPrice: '',
    rating: 0,
    image: 'https://images.unsplash.com/photo-1608248597359-994441604a43?w=400&auto=format&fit=crop&q=80',
    tag: ''
  },
  {
    id: 5,
    name: 'Combo Tạm Biệt Tóc Bết Dầu - Sáp Glanzen Floral + Xịt...',
    price: '458.000',
    oldPrice: '',
    rating: 0,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80',
    tag: 'COMBO'
  },
  {
    id: 6,
    name: 'Combo Giữ Nếp Siêu Dưỡng Sáp Kevin Murphy + Gôm...',
    price: '579.000',
    oldPrice: '1.018.000',
    rating: 0,
    image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&auto=format&fit=crop&q=80',
    tag: 'TIẾT KIỆM'
  },
  {
    id: 7,
    name: 'Sáp Vuốt Tóc Glanzen Limited 30Shine Phân Phối...',
    price: '399.000',
    oldPrice: '798.000',
    rating: 0,
    image: 'https://images.unsplash.com/photo-1597354315366-eb1d0728c11a?w=400&auto=format&fit=crop&q=80',
    tag: 'LIMITED'
  }
];

const Shop = ({ onAddToCart, onBuyNow }) => {
  const [activeCategory, setActiveCategory] = useState('Sáp vuốt tóc');

  return (
    <div className="w-full flex-1 flex flex-col">
      <div className="w-full bg-gray-50 py-3 border-b border-gray-200">
        <div className="max-w-[1280px] mx-auto px-4">
          <Breadcrumb
            items={[
              { title: <span className="text-gray-500 cursor-pointer hover:text-blue-600 transition-colors">Trang chủ</span> },
              { title: <span className="text-gray-500 cursor-pointer hover:text-blue-600 transition-colors">Tạo kiểu tóc</span> },
              { title: <span className="text-gray-900 font-medium">Sáp vuốt tóc</span> }
            ]}
          />
        </div>
      </div>

      <main className="w-full flex-1">
        <div className="max-w-[1280px] mx-auto px-4 py-8">
          <div className="mb-8 mt-12">
            <h1 className="text-3xl font-bold uppercase mb-6 text-gray-900">Sáp vuốt tóc</h1>

            <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-8 border-b border-gray-200">
              {MOCK_CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`whitespace-nowrap pb-3 text-lg font-medium transition-all duration-300 relative ${activeCategory === category
                    ? 'text-blue-700'
                    : 'text-gray-600 hover:text-blue-600'
                    }`}
                >
                  {category}
                  <div className={`absolute bottom-0 left-0 h-0.5 bg-blue-700 transition-all duration-500 ease-out 
                                    ${activeCategory === category ? 'w-full' : 'w-0'
                    }`}></div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            <FilterSidebar />

            <div className="flex-1 w-full">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <p className="text-gray-600 text-sm">
                  <span className="font-bold">{MOCK_PRODUCTS.length}</span> sản phẩm được tìm thấy theo "{activeCategory}"
                </p>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600 font-medium">Sắp xếp theo</span>
                  <Select
                    defaultValue="rating"
                    style={{ width: 140 }}
                    options={[
                      { value: 'rating', label: 'Đánh giá cao' },
                      { value: 'price_asc', label: 'Giá thấp đến cao' },
                      { value: 'price_desc', label: 'Giá cao xuống thấp' },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_PRODUCTS.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={() => onAddToCart(product)}
                    onBuyNow={() => onBuyNow(product)}
                  />
                ))}
              </div>
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

  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false);
  const [isCartVisible, setIsCartVisible] = useState(false);

  const openLogin = () => {
    setIsRegisterModalVisible(false);
    setIsLoginModalVisible(true);
  };

  const openRegister = () => {
    setIsLoginModalVisible(false);
    setIsRegisterModalVisible(true);
  };

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
    const priceNumber = parseInt(product.price.replace(/\./g, ""), 10);

    dispatch(
      addToCart({
        id: product.id,
        name: product.name,
        price: priceNumber,
        image: product.image,
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
        onLoginClick={openLogin}
        onRegisterClick={openRegister}
        onCartClick={() => setIsCartVisible(true)}
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
      ></ShopLayoutHeader>

      <CartPage
        visible={isCartVisible}
        onClose={() => setIsCartVisible(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => {
          setIsCartVisible(false); 
          navigate("/checkout")
        }}
      />

      <LoginPage
        visible={isLoginModalVisible}
        onClose={() => setIsLoginModalVisible(false)}
        onGoToRegister={openRegister}
      />

      <RegisterPage
        visible={isRegisterModalVisible}
        onClose={() => setIsRegisterModalVisible(false)}
        onLogin={openLogin}
      />

      <Shop
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />

      <Footer />
    </div>
  );
}