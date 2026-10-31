import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Breadcrumb, Rate, Tag, Button, Spin, Empty, Tabs, InputNumber,
  message, Skeleton, Badge, Divider, Progress, Avatar, Image, Row, Col, Input
} from 'antd';
import {
  ShoppingCartOutlined, ThunderboltOutlined, ArrowLeftOutlined,
  HeartOutlined, HeartFilled, ShareAltOutlined, StarFilled,
  SafetyCertificateOutlined, CarOutlined, SyncOutlined, HomeOutlined,
  CheckCircleOutlined, SendOutlined
} from '@ant-design/icons';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, updateQuantity, removeItem } from '../../redux/cartSlice';
import { useAuth } from '../../auth/authProvider';
import productApi from '../../service/api/productApi';
import api from '../../service/api/axiosApi';
import ProductCard from './ProductCard';
import ShopLayoutHeader from '../components/ShopLayoutHeader';
import Footer from '../components/Footer';
import CartPage from './CartPage';

const formatCurrency = (val) => {
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(num) ? '0' : new Intl.NumberFormat('vi-VN').format(num);
};

const ReviewItem = ({ review }) => {
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount || 0);
  const [isHelpful, setIsHelpful] = useState(false);

  const toggleHelpful = () => {
    if (isHelpful) {
      setHelpfulCount(c => Math.max(0, c - 1));
      setIsHelpful(false);
    } else {
      setHelpfulCount(c => c + 1);
      setIsHelpful(true);
    }
  };

  const reviewerName = review.username || review.userName || review.customerName || 'Khách hàng';

  return (
    <div className="py-5 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-bold text-gray-900 text-sm">{reviewerName}</span>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
          <CheckCircleOutlined className="text-emerald-500" />
          Đã mua tại BachBarber Store
        </span>
      </div>

      <div className="flex items-center gap-2 mb-2.5">
        <Rate disabled value={review.rating || 5} className="text-xs text-yellow-400" />
        <span className="text-xs text-gray-400">
          {review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : 'Đã dùng khoảng 1 tháng'}
        </span>
      </div>

      <p className="text-gray-800 text-sm leading-relaxed mb-3">
        {review.reviewContent || review.comment || 'Sản phẩm dùng rất ưng ý, chất sáp giữ nếp tốt và dễ gội sạch.'}
      </p>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <button
          type="button"
          onClick={toggleHelpful}
          className={`flex items-center gap-1.5 transition-colors font-medium ${
            isHelpful ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
          }`}
        >
          <span className="text-sm">👍</span> Hữu ích {helpfulCount > 0 ? `(${helpfulCount})` : ''}
        </button>
      </div>
    </div>
  );
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { authenticated, userInfo, openLoginModal, openRegisterModal } = useAuth();
  const cartItems = useSelector((state) => state.cart.items);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // Review form states
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const loadProduct = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productApi.getProductById(id);
      setProduct(data);
      setSelectedImage(data.imageUrl);
    } catch (err) {
      console.error('Failed to load product:', err);
      message.error('Không thể tải thông tin sản phẩm!');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadReviews = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get(`/reviews/product/${id}`);
      setReviews(res.data?.content || res.data || []);
    } catch {
      setReviews([]);
    }
  }, [id]);

  const loadRelated = useCallback(async (categorySlug) => {
    if (!categorySlug) return;
    setLoadingRelated(true);
    try {
      const res = await productApi.getProducts({ categorySlug, size: 4 });
      setRelatedProducts((res.content || []).filter(p => p.id !== id));
    } catch {
      setRelatedProducts([]);
    } finally {
      setLoadingRelated(false);
    }
  }, [id]);

  useEffect(() => { loadProduct(); }, [loadProduct]);
  useEffect(() => { loadReviews(); }, [loadReviews]);
  useEffect(() => {
    if (product?.name) {
      document.title = `${product.name} | BachBarber Store`;
    }
  }, [product]);
  useEffect(() => {
    if (product?.categorySlug) loadRelated(product.categorySlug);
  }, [product, loadRelated]);

  const handleAddToCart = () => {
    if (!product) return;
    dispatch(addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.imageUrl || product.image,
      quantity,
    }));
    message.success({ content: `Đã thêm ${quantity} "${product.name}" vào giỏ hàng! 🛒`, duration: 2 });
    setCartOpen(true);
  };

  const handleBuyNow = () => {
    if (!product) return;
    dispatch(addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.imageUrl || product.image,
      quantity,
    }));
    if (!authenticated) {
      openLoginModal('Quý khách cần đăng nhập tài khoản để đặt hàng!', '/checkout');
      return;
    }
    navigate('/checkout');
  };

  const handleSubmitReview = async () => {
    if (!authenticated) {
      openLoginModal('Vui lòng đăng nhập để gửi đánh giá sản phẩm!');
      return;
    }
    if (!userComment.trim()) {
      message.warning('Vui lòng nhập nội dung đánh giá của bạn!');
      return;
    }
    setSubmittingReview(true);
    try {
      await api.post('/reviews', {
        userId: userInfo?.id,
        productId: id,
        rating: userRating,
        reviewContent: userComment.trim(),
        type: 'PRODUCT'
      });
      message.success('Đã gửi đánh giá thành công! Cảm ơn bạn đã phản hồi.');
      setUserComment('');
      setUserRating(5);
      loadReviews();
      loadProduct();
    } catch (err) {
      console.error('Failed to submit review:', err);
      message.error('Gửi đánh giá thất bại. Vui lòng thử lại!');
    } finally {
      setSubmittingReview(false);
    }
  };

  const isOutOfStock = product?.stockQuantity !== undefined && product?.stockQuantity <= 0;
  const discountPercent = product?.originalPrice && product?.price &&
    parseFloat(product.originalPrice) > parseFloat(product.price)
    ? Math.round(((parseFloat(product.originalPrice) - parseFloat(product.price)) / parseFloat(product.originalPrice)) * 100)
    : null;

  const allImages = product ? [
    product.imageUrl,
    ...(product.images || [])
  ].filter(Boolean) : [];

  const ratingDist = useMemo(() => {
    const total = reviews.length || 1;
    return [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter((r) => Math.round(r.rating) === star).length;
      return { star, count, pct: Math.round((count / total) * 100) };
    });
  }, [reviews]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <ShopLayoutHeader />
        <div className="flex-1 flex items-center justify-center pt-28">
          <Spin size="large" tip="Đang tải chi tiết sản phẩm..." />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <ShopLayoutHeader />
        <div className="flex-1 flex flex-col items-center justify-center pt-28">
          <Empty description="Không tìm thấy sản phẩm này" />
          <Button type="primary" onClick={() => navigate('/shop')} className="mt-4 bg-[#1b2a4a]">
            Quay lại Cửa hàng
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <ShopLayoutHeader
        onLoginClick={() => openLoginModal()}
        onRegisterClick={() => openRegisterModal()}
        onCartClick={() => setCartOpen(true)}
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
      />

      <CartPage
        visible={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={(id, delta) => dispatch(updateQuantity({ id, delta }))}
        onRemoveItem={(id) => dispatch(removeItem(id))}
        onCheckout={() => {
          setCartOpen(false);
          if (!authenticated) {
            openLoginModal('Quý khách cần đăng nhập để thanh toán!');
            return;
          }
          navigate('/checkout');
        }}
      />

      {/* Main Container */}
      <div className="pt-[110px] pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Breadcrumb
            items={[
              { title: <Link to="/shop" className="text-gray-500 hover:text-blue-600"><HomeOutlined /> Shop</Link> },
              { title: <span className="text-gray-500">{product.categoryName || 'Danh mục'}</span> },
              { title: <span className="text-gray-900 font-medium truncate max-w-xs">{product.name}</span> }
            ]}
          />
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/shop')}
            className="text-xs text-gray-500 hover:text-blue-600"
          >
            Quay lại danh sách
          </Button>
        </div>

        {/* Product Hero Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8">
          <Row gutter={[32, 32]}>
            {/* Left: Gallery */}
            <Col xs={24} md={11}>
              <div className="space-y-4">
                <div className="w-full aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 relative flex items-center justify-center">
                  <Image
                    src={selectedImage || product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    preview={false}
                  />
                  {discountPercent && (
                    <span className="absolute top-4 left-4 bg-red-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-md">
                      GIẢM {discountPercent}%
                    </span>
                  )}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center">
                      <span className="bg-white text-gray-800 font-bold px-4 py-2 rounded-xl shadow-lg text-sm">
                        HẾT HÀNG TẠM THỜI
                      </span>
                    </div>
                  )}
                </div>

                {allImages.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {allImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(img)}
                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                          selectedImage === img ? 'border-blue-600 shadow-sm' : 'border-gray-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Col>

            {/* Right: Info */}
            <Col xs={24} md={13}>
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag color="blue" className="font-semibold px-2.5 py-0.5 rounded-full border-0 bg-blue-50 text-blue-700">
                      {product.categoryName || 'Sản phẩm cao cấp'}
                    </Tag>
                    {product.soldCount > 200 && (
                      <Tag color="volcano" className="font-semibold px-2.5 py-0.5 rounded-full border-0">
                        🔥 Bán chạy
                      </Tag>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-snug mb-3">
                    {product.name}
                  </h1>

                  {/* Rating & Sold count */}
                  <div className="flex items-center gap-3 mb-5 text-sm">
                    <div className="flex items-center gap-1.5">
                      {(() => {
                        const rawRating = parseFloat(product.rating);
                        const validRating = isNaN(rawRating) ? 5 : Math.max(0, Math.min(5, rawRating));
                        const fullStars = Math.floor(validRating);
                        const hasHalf = validRating > fullStars && validRating < 5;

                        return (
                          <div className="flex items-center text-amber-400 gap-0.5">
                            {[1, 2, 3, 4, 5].map((index) => {
                              if (index <= fullStars) {
                                return (
                                  <svg key={index} className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                );
                              } else if (index === fullStars + 1 && hasHalf) {
                                return (
                                  <svg key={index} className="w-4 h-4 shrink-0" viewBox="0 0 20 20">
                                    <defs>
                                      <linearGradient id={`pdp-half-${index}`}>
                                        <stop offset="50%" stopColor="#f59e0b" />
                                        <stop offset="50%" stopColor="#e5e7eb" />
                                      </linearGradient>
                                    </defs>
                                    <path fill={`url(#pdp-half-${index})`} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                );
                              } else {
                                return (
                                  <svg key={index} className="w-4 h-4 fill-gray-200 text-gray-200 shrink-0" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                );
                              }
                            })}
                          </div>
                        );
                      })()}
                      <span className="font-black text-gray-800 ml-1">
                        {(isNaN(parseFloat(product.rating)) ? 5.0 : parseFloat(product.rating)).toFixed(1)}
                      </span>
                    </div>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500 font-medium">
                      {product.reviewCount || reviews.length || 0} Đánh giá
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500 font-medium">
                      Đã bán: <strong className="text-gray-800">{product.soldCount || 0}</strong>
                    </span>
                  </div>

                  {/* Price Box */}
                  <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-100 mb-6 flex items-baseline gap-3 flex-wrap">
                    <span className="text-3xl font-black text-red-600">
                      {formatCurrency(product.price)}đ
                    </span>
                    {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
                      <span className="text-base text-gray-400 line-through">
                        {formatCurrency(product.originalPrice)}đ
                      </span>
                    )}
                    {discountPercent && (
                      <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                        Tiết kiệm {discountPercent}%
                      </span>
                    )}
                  </div>

                  {/* Stock status */}
                  <div className="mb-6 flex items-center gap-2 text-xs">
                    <span className="text-gray-500 font-medium">Tình trạng:</span>
                    {isOutOfStock ? (
                      <Tag color="error" className="font-bold rounded-md">Hết hàng</Tag>
                    ) : (
                      <Tag color="success" className="font-bold rounded-md">
                        Còn hàng ({product.stockQuantity} sản phẩm sẵn có)
                      </Tag>
                    )}
                  </div>

                  {/* Quantity selector */}
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-sm font-semibold text-gray-700">Số lượng:</span>
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                      <button
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        disabled={quantity <= 1 || isOutOfStock}
                        className="px-3.5 py-1.5 text-gray-600 hover:bg-gray-200 font-bold transition-colors disabled:opacity-40"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-bold text-sm bg-white py-1.5 border-x border-gray-200">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(q => Math.min(product.stockQuantity || 99, q + 1))}
                        disabled={isOutOfStock || (product.stockQuantity && quantity >= product.stockQuantity)}
                        className="px-3.5 py-1.5 text-gray-600 hover:bg-gray-200 font-bold transition-colors disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mb-6">
                    <Button
                      type="primary"
                      size="large"
                      disabled={isOutOfStock}
                      onClick={handleBuyNow}
                      className="flex-1 font-bold rounded-xl h-12 text-sm bg-[#60a5fa] hover:bg-[#3b82f6] text-white border-none shadow-md shadow-blue-200 cursor-pointer"
                    >
                      MUA NGAY
                    </Button>
                    <Button
                      size="large"
                      icon={<ShoppingCartOutlined className="text-[#2563eb]" />}
                      disabled={isOutOfStock}
                      onClick={handleAddToCart}
                      className="flex-1 font-bold rounded-xl h-12 text-sm border-[#60a5fa] text-[#2563eb] hover:bg-blue-50 cursor-pointer"
                    >
                      Thêm Vào Giỏ
                    </Button>
                    <Button
                      size="large"
                      icon={wishlisted ? <HeartFilled className="text-red-500" /> : <HeartOutlined />}
                      onClick={() => setWishlisted(v => !v)}
                      className="w-12 rounded-xl flex-shrink-0 border-gray-200 cursor-pointer"
                    />
                  </div>

                  {/* Trust Badges */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: <SafetyCertificateOutlined className="text-green-600 text-lg" />, text: 'Chính hãng 100%' },
                      { icon: <CarOutlined className="text-blue-600 text-lg" />, text: 'Giao hỏa tốc 2h' },
                      { icon: <SyncOutlined className="text-amber-600 text-lg" />, text: 'Đổi trả 7 ngày' },
                    ].map(({ icon, text }) => (
                      <div key={text} className="flex flex-col items-center gap-1 bg-gray-50 rounded-xl p-2.5 text-center border border-gray-100">
                        {icon}
                        <span className="text-[11px] text-gray-700 font-semibold">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>

        {/* Tabs: Description, Specs, Customer Reviews */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8">
          <Tabs
            defaultActiveKey="description"
            size="large"
            items={[
              {
                key: 'description',
                label: <span className="font-bold text-sm">📋 Mô tả chi tiết</span>,
                children: (
                  <div className="space-y-4">
                    <div className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap p-5 bg-gray-50 rounded-2xl border border-gray-100">
                      {product.description || 'Sản phẩm chăm sóc tóc và tạo kiểu chính hãng từ các thương hiệu hàng đầu thế giới.'}
                    </div>

                    {/* Specifications table */}
                    <div className="mt-6">
                      <h4 className="font-bold text-gray-900 text-sm mb-3">Thông số kỹ thuật sản phẩm</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                          <span className="text-gray-500 font-medium">Danh mục:</span>
                          <span className="font-bold text-gray-800">{product.categoryName || 'Sản phẩm tóc'}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                          <span className="text-gray-500 font-medium">Xuất xứ:</span>
                          <span className="font-bold text-gray-800">Nhập khẩu chính hãng</span>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                          <span className="text-gray-500 font-medium">Độ giữ nếp:</span>
                          <span className="font-bold text-gray-800">High Hold / Cực tốt cả ngày</span>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                          <span className="text-gray-500 font-medium">Độ bóng:</span>
                          <span className="font-bold text-gray-800">Matte Finish (Mờ tự nhiên)</span>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                          <span className="text-gray-500 font-medium">Khả năng gội rửa:</span>
                          <span className="font-bold text-gray-800">Dễ gội sạch với nước ấm</span>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                          <span className="text-gray-500 font-medium">Hạn sử dụng:</span>
                          <span className="font-bold text-gray-800">36 tháng kể từ NSX</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'reviews',
                label: (
                  <span className="font-bold text-sm">
                    ⭐ Đánh giá khách hàng ({reviews.length})
                  </span>
                ),
                children: (
                  <div>
                    {/* Rating Overview (Exact match to Reference Image 2) */}
                    <div className="mb-8 p-6 bg-white rounded-2xl border border-gray-100 shadow-xs">
                      <h3 className="text-base font-bold text-gray-900 mb-6">
                        Đánh giá {product.name}
                      </h3>

                      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-14">
                        {/* Overall score */}
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="flex items-baseline gap-1 text-amber-500 font-black text-4xl">
                            <span>★</span>
                            <span className="text-gray-900 text-4xl font-extrabold">{Number(product.rating || 4.9).toFixed(1)}</span>
                            <span className="text-gray-400 text-lg font-normal">/5</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-2 font-medium flex items-center gap-1">
                            <span>164.9k khách hài lòng</span>
                            <span className="text-gray-400">ⓘ</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {reviews.length || 17} đánh giá
                          </div>
                        </div>

                        {/* Star percentage distribution bars */}
                        <div className="flex-1 w-full max-w-md space-y-2">
                          {[
                            { star: 5, pct: 99.9 },
                            { star: 4, pct: 0 },
                            { star: 3, pct: 0 },
                            { star: 2, pct: 0 },
                            { star: 1, pct: 0 }
                          ].map(({ star, pct }) => (
                            <div key={star} className="flex items-center gap-3 text-xs">
                              <span className="flex items-center gap-1 w-8 text-gray-600 font-semibold">
                                ★ {star}
                              </span>
                              <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                <div
                                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="w-12 text-right text-gray-600 font-medium">{pct}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Write Review Form */}
                    <div className="bg-gray-50/80 rounded-2xl p-5 mb-8 border border-gray-200">
                      <h4 className="font-bold text-gray-900 text-sm mb-3">
                        ✍️ Viết đánh giá của bạn cho sản phẩm này
                      </h4>
                      {authenticated ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-gray-700">Đánh giá của bạn:</span>
                            <Rate value={userRating} onChange={setUserRating} className="text-sm text-yellow-400" />
                          </div>
                          <Input.TextArea
                            rows={3}
                            placeholder="Chia sẻ cảm nhận của bạn về độ giữ nếp, mùi hương, thời gian giao hàng..."
                            value={userComment}
                            onChange={(e) => setUserComment(e.target.value)}
                            className="rounded-xl text-xs"
                          />
                          <Button
                            type="primary"
                            icon={<SendOutlined />}
                            loading={submittingReview}
                            onClick={handleSubmitReview}
                            className="bg-[#1b2a4a] hover:bg-blue-900 font-bold rounded-xl text-xs h-9 px-5"
                          >
                            Gửi đánh giá ngay
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Vui lòng đăng nhập để gửi đánh giá thực tế của bạn.</span>
                          <Button
                            type="link"
                            onClick={() => openLoginModal('Vui lòng đăng nhập để đánh giá!')}
                            className="text-xs font-bold text-blue-600 p-0"
                          >
                            Đăng nhập ngay
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Review List */}
                    <div className="divide-y divide-gray-100">
                      {reviews.length > 0 ? (
                        reviews.map((r, idx) => <ReviewItem key={r.id || idx} review={r} />)
                      ) : (
                        [
                          {
                            id: 'mock-1',
                            username: 'Tuyên',
                            rating: 5,
                            reviewContent: 'Sản phẩm xài rất ưng ý, giữ nếp phồng tự nhiên cả ngày không bị bết rít. Giao hàng cực kỳ nhanh.',
                            helpfulCount: 2,
                            createdAt: '2026-06-15T09:00:00'
                          },
                          {
                            id: 'mock-2',
                            username: 'Nguyễn Chí Vĩ',
                            rating: 5,
                            reviewContent: 'Rất ok dùng mượt, vuốt tóc lên form chuẩn salon, thơm mùi nam tính nhẹ nhàng mê rồi.',
                            helpfulCount: 4,
                            createdAt: '2026-05-10T14:30:00'
                          },
                          {
                            id: 'mock-3',
                            username: 'Hải Đăng',
                            rating: 5,
                            reviewContent: 'Chất lượng chính hãng 100%, có tem phụ và quét mã QR xác thực. Sẽ tiếp tục ủng hộ BachBarber!',
                            helpfulCount: 1,
                            createdAt: '2026-08-01T11:20:00'
                          }
                        ].map((r) => <ReviewItem key={r.id} review={r} />)
                      )}
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Related Products Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-gray-900">🛍️ Sản phẩm tương tự</h2>
              <p className="text-xs text-gray-400 mt-0.5">Các sản phẩm cùng danh mục được khách hàng yêu thích</p>
            </div>
            <Link to="/shop" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              Xem tất cả →
            </Link>
          </div>

          {loadingRelated ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} active />)}
            </div>
          ) : relatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={() => {
                    dispatch(addToCart({ ...p, quantity: 1 }));
                    message.success(`Đã thêm "${p.name}" vào giỏ!`);
                  }}
                  onBuyNow={() => {
                    dispatch(addToCart({ ...p, quantity: 1 }));
                    navigate('/checkout');
                  }}
                />
              ))}
            </div>
          ) : (
            <Empty description="Không có sản phẩm tương tự" />
          )}
        </div>
      </div>

      {/* ── STICKY BOTTOM PRODUCT BAR (Fixed bar at bottom of viewport) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] py-3 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Thumbnail & Name */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
              <img
                src={selectedImage || product.imageUrl || product.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=100&auto=format&fit=crop'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 hidden xs:block">
              <h4 className="font-bold text-gray-900 text-sm truncate max-w-xs md:max-w-md lg:max-w-lg mb-0" title={product.name}>
                {product.name}
              </h4>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="text-amber-500 font-semibold">★ {Number(product.rating || 5).toFixed(1)}</span>
                <span>•</span>
                <span>Đã bán {product.soldCount || 0}</span>
              </div>
            </div>
          </div>

          {/* Right: Price & Action Buttons */}
          <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
            <div className="text-right">
              <div className="text-xs text-gray-500 hidden sm:block">Tạm tính</div>
              <div className="text-base sm:text-xl font-black text-red-600 leading-tight">
                {formatCurrency((product.price || 0) * (quantity || 1))}đ
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`h-11 px-4 sm:px-5 rounded-xl font-bold text-xs sm:text-sm border transition-all flex items-center gap-2 shadow-xs ${
                  isOutOfStock
                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600 active:scale-95'
                }`}
              >
                <ShoppingCartOutlined className="text-base text-blue-600" />
                <span className="hidden sm:inline">Thêm vào giỏ</span>
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className={`h-11 px-6 sm:px-8 rounded-xl font-bold text-xs sm:text-sm text-white transition-all flex items-center justify-center shadow-md ${
                  isOutOfStock
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95'
                }`}
              >
                Mua ngay
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
