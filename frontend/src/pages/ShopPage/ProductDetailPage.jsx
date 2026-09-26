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
import { addToCart } from '../../redux/cartSlice';
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

const ReviewItem = ({ review }) => (
  <div className="py-4 border-b border-gray-100 last:border-0">
    <div className="flex items-start gap-3">
      <Avatar size={42} className="bg-blue-100 text-blue-600 font-bold flex-shrink-0">
        {(review.username || review.userName || review.customerName || 'K').charAt(0).toUpperCase()}
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800 text-sm">
              {review.username || review.userName || review.customerName || 'Khách hàng'}
            </span>
            <Tag color="cyan" className="text-[10px] py-0 px-1.5 font-medium border-0 bg-blue-50 text-blue-600">
              <CheckCircleOutlined className="mr-1" />Đã mua hàng
            </Tag>
          </div>
          <span className="text-xs text-gray-400">
            {review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : ''}
          </span>
        </div>
        <Rate disabled value={review.rating || 5} allowHalf className="text-xs mb-1.5 text-yellow-400" />
        <p className="text-gray-700 text-sm leading-relaxed mb-0">{review.reviewContent || review.comment || ''}</p>
      </div>
    </div>
  </div>
);

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
        onUpdateQuantity={(id, delta) => dispatch({ type: 'cartItems/updateQuantity', payload: { id, delta } })}
        onRemoveItem={(id) => dispatch({ type: 'cartItems/removeItem', payload: id })}
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
      <div className="pt-[110px] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
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
                    <div className="flex items-center gap-1">
                      <Rate disabled value={product.rating || 5} allowHalf className="text-xs text-yellow-400" />
                      <span className="font-black text-gray-800 ml-1">
                        {Number(product.rating || 5).toFixed(1)}
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
                      className="flex-1 font-bold rounded-xl h-12 text-sm bg-[#1b2a4a] hover:bg-blue-900 border-none shadow-md"
                    >
                      MUA NGAY
                    </Button>
                    <Button
                      size="large"
                      icon={<ShoppingCartOutlined />}
                      disabled={isOutOfStock}
                      onClick={handleAddToCart}
                      className="flex-1 font-bold rounded-xl h-12 text-sm border-[#1b2a4a] text-[#1b2a4a] hover:bg-blue-50"
                    >
                      Thêm Vào Giỏ
                    </Button>
                    <Button
                      size="large"
                      icon={wishlisted ? <HeartFilled className="text-red-500" /> : <HeartOutlined />}
                      onClick={() => setWishlisted(v => !v)}
                      className="w-12 rounded-xl flex-shrink-0 border-gray-200"
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
                    {/* Rating Overview */}
                    <div className="flex flex-col sm:flex-row gap-6 mb-8 p-6 bg-blue-50/40 rounded-2xl border border-blue-100 items-center">
                      <div className="flex flex-col items-center justify-center min-w-[140px] text-center">
                        <span className="text-5xl font-black text-blue-600">
                          {Number(product.rating || 5).toFixed(1)}
                        </span>
                        <Rate disabled value={product.rating || 5} allowHalf className="text-sm mt-1 text-yellow-400" />
                        <span className="text-xs text-gray-500 mt-1 font-medium">
                          {reviews.length} lượt đánh giá thực tế
                        </span>
                      </div>

                      <div className="flex-1 w-full space-y-1.5">
                        {ratingDist.map(({ star, count, pct }) => (
                          <div key={star} className="flex items-center gap-2.5 text-xs">
                            <span className="w-12 text-gray-600 font-semibold">{star} sao</span>
                            <Progress
                              percent={pct}
                              showInfo={false}
                              strokeColor="#facc15"
                              className="flex-1 m-0"
                              size={[undefined, 8]}
                            />
                            <span className="w-12 text-right text-gray-500 font-mono">({count})</span>
                          </div>
                        ))}
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
                        <Empty
                          description={<span className="text-gray-400 text-xs">Chưa có đánh giá nào từ khách hàng.</span>}
                          className="py-8"
                        />
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

      <Footer />
    </div>
  );
}
