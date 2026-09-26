import React, { useEffect, useState, useMemo } from "react";
import {
  Layout,
  Menu,
  Avatar,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Badge,
  Spin,
  Tabs,
  Progress,
  Button,
  Input,
  Select,
  Segmented,
  Modal,
  Form,
  Switch,
  message,
  Tooltip,
  Divider,
  Popconfirm,
  DatePicker,
  InputNumber,
  Rate,
} from "antd";
import {
  UserOutlined,
  TeamOutlined,
  ScissorOutlined,
  HomeOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  CalendarOutlined,
  RiseOutlined,
  DashboardOutlined,
  BankOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  DollarOutlined,
  StarOutlined,
  EyeOutlined,
  FilterOutlined,
  CheckOutlined,
  ArrowUpOutlined,
  FireOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CreditCardOutlined,
  CheckSquareOutlined,
  GiftOutlined,
  PlusOutlined,
  DeleteOutlined,
  TagOutlined,
  PercentageOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../auth/authProvider";
import { useNavigate } from "react-router-dom";
import { getGlobalStatistics, getAllBookings } from "../../service/api/bookingApi";
import { getUsers, getStylists, updateBookingStatus, getStylistServices } from "../../service/api/adminApi";
import { getSalons } from "../../service/api/salonApi";
import { getServiceOfferings } from "../../service/api/serviceApi";
import { getAdminVouchers, createVoucher, deleteVoucher } from "../../service/api/voucherApi";
import { getAdminProducts, createAdminProduct, updateAdminProduct, deleteAdminProduct, getAdminProductStats, getAdminOrders, updateAdminOrderStatus, getAdminReviews, deleteAdminReview } from "../../service/api/adminApi";
import { getProductCategories } from "../../service/api/productApi";
import { EditOutlined, ReloadOutlined } from "@ant-design/icons";
import notificationWs from "../../service/websocket/notificationWebSocket";

const { Header, Sider, Content } = Layout;
const { Option } = Select;

const parseAnyDate = (dt) => {
  if (!dt) return null;
  try {
    if (Array.isArray(dt)) {
      return new Date(dt[0], (dt[1] || 1) - 1, dt[2] || 1, dt[3] || 0, dt[4] || 0, dt[5] || 0);
    }
    const d = new Date(dt);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

// Helper tạo đường cong SVG mượt mà từ mảng tọa độ
const generateSvgPath = (points) => {
  if (!points || points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
};

// Helper tạo vùng gradient kín dưới đường Line SVG
const generateAreaPath = (points, bottomY) => {
  if (!points || points.length === 0) return "";
  const linePath = generateSvgPath(points);
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath} L ${last.x.toFixed(1)} ${bottomY} L ${first.x.toFixed(1)} ${bottomY} Z`;
};

const formatCurrency = (val) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val ?? 0);

const formatDate = (dt) => {
  if (!dt) return "—";
  const d = parseAnyDate(dt);
  if (!d) return "—";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const STATUS_LABELS = {
  PENDING: { label: "Chờ xác nhận", color: "gold", antStatus: "warning", hex: "#faad14" },
  CONFIRMED: { label: "Đã xác nhận", color: "processing", antStatus: "processing", hex: "#1890ff" },
  IN_PROGRESS: { label: "Đang thực hiện", color: "purple", antStatus: "processing", hex: "#722ed1" },
  COMPLETED: { label: "Hoàn thành", color: "success", antStatus: "success", hex: "#52c41a" },
  CANCELLED: { label: "Đã hủy", color: "error", antStatus: "error", hex: "#f5222d" },
};

export default function AdminDashboard() {
  const { userInfo, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [salons, setSalons] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  // Filter & Search states for bookings
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("ALL");
  const [bookingSalonFilter, setBookingSalonFilter] = useState("ALL");
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Filter for users
  const [userSearch, setUserSearch] = useState("");
  const [userTierFilter, setUserTierFilter] = useState("ALL");

  // Stylist service modal
  const [selectedStylistServices, setSelectedStylistServices] = useState(null);
  const [selectedStylistName, setSelectedStylistName] = useState("");
  const [stylistServicesLoading, setStylistServicesLoading] = useState(false);

  // Time range for statistics
  const [statsRange, setStatsRange] = useState("30_DAYS");

  // Vouchers state
  const [vouchers, setVouchers] = useState([]);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [creatingVoucher, setCreatingVoucher] = useState(false);
  const [voucherForm] = Form.useForm();

  const [products, setProducts] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [productStats, setProductStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewFilterRating, setReviewFilterRating] = useState('ALL');
  const [productSearch, setProductSearch] = useState('');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productForm] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, bookingsData, usersData, salonsData, stylistsData, servicesData, vouchersData] =
        await Promise.allSettled([
          getGlobalStatistics(),
          getAllBookings(),
          getUsers(),
          getSalons(),
          getStylists(),
          getServiceOfferings(),
          getAdminVouchers(),
        ]);

      if (statsData.status === "fulfilled") setStats(statsData.value);
      if (bookingsData.status === "fulfilled") setBookings(bookingsData.value || []);
      if (usersData.status === "fulfilled") setUsers(usersData.value || []);
      if (salonsData.status === "fulfilled") setSalons(salonsData.value || []);
      if (stylistsData.status === "fulfilled") setStylists(stylistsData.value || []);
      if (servicesData.status === "fulfilled") setServices(servicesData.value || []);
      if (vouchersData.status === "fulfilled") setVouchers(vouchersData.value || []);
    } catch (err) {
      console.error("Error loading admin dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadDataQuietly = async () => {
    try {
      const [statsData, bookingsData, usersData, salonsData, stylistsData, servicesData, vouchersData] =
        await Promise.allSettled([
          getGlobalStatistics(),
          getAllBookings(),
          getUsers(),
          getSalons(),
          getStylists(),
          getServiceOfferings(),
          getAdminVouchers(),
        ]);

      if (statsData.status === "fulfilled") setStats(statsData.value);
      if (bookingsData.status === "fulfilled") setBookings(bookingsData.value || []);
      if (usersData.status === "fulfilled") setUsers(usersData.value || []);
      if (salonsData.status === "fulfilled") setSalons(salonsData.value || []);
      if (stylistsData.status === "fulfilled") setStylists(stylistsData.value || []);
      if (servicesData.status === "fulfilled") setServices(servicesData.value || []);
      if (vouchersData.status === "fulfilled") setVouchers(vouchersData.value || []);
    } catch (err) {
      console.error("Silent sync error:", err);
    }
  };

  useEffect(() => {
    if (activeSection === 'products' || activeSection === 'orders' || activeSection === 'reviews') {
      loadProductsAndOrders();
    }
  }, [activeSection]);

  const loadProductsAndOrders = async () => {
    try {
      const [prodsData, orderData, catData, statsData, revsData] = await Promise.allSettled([
        getAdminProducts(),
        getAdminOrders(),
        getProductCategories ? getProductCategories() : Promise.resolve([]),
        getAdminProductStats ? getAdminProductStats() : Promise.resolve(null),
        getAdminReviews(),
      ]);
      if (prodsData.status === 'fulfilled') setProducts(prodsData.value?.content || prodsData.value || []);
      if (orderData.status === 'fulfilled') setOrders(orderData.value || []);
      if (catData.status === 'fulfilled') setProductCategories(catData.value || []);
      if (statsData.status === 'fulfilled') setProductStats(statsData.value);
      if (revsData.status === 'fulfilled') setReviews(revsData.value?.content || revsData.value || []);
    } catch (err) {
      console.error('Error loading products/orders/reviews:', err);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await deleteAdminReview(reviewId);
      message.success('Đã xóa đánh giá thành công!');
      loadProductsAndOrders();
    } catch {
      message.error('Xóa đánh giá thất bại!');
    }
  };

  const handleOpenProductModal = (product = null) => {
    setEditingProduct(product);
    if (product) {
      productForm.setFieldsValue({
        name: product.name,
        description: product.description,
        price: Number(product.price),
        originalPrice: Number(product.originalPrice),
        stockQuantity: product.stockQuantity,
        imageUrl: product.imageUrl,
        categoryId: product.categoryId,
        active: product.active,
      });
    } else {
      productForm.resetFields();
      productForm.setFieldsValue({ active: true });
    }
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (values) => {
    setSavingProduct(true);
    try {
      const payload = {
        name: values.name,
        description: values.description,
        price: values.price,
        originalPrice: values.originalPrice || values.price,
        stockQuantity: values.stockQuantity || 0,
        imageUrl: values.imageUrl,
        categoryId: values.categoryId,
        active: values.active !== undefined ? values.active : true,
      };
      if (editingProduct) {
        await updateAdminProduct(editingProduct.id, payload);
        message.success('Đã cập nhật sản phẩm thành công!');
      } else {
        await createAdminProduct(payload);
        message.success('Đã tạo sản phẩm mới thành công!');
      }
      setProductModalOpen(false);
      productForm.resetFields();
      loadProductsAndOrders();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Lưu sản phẩm thất bại!');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await deleteAdminProduct(productId);
      message.success('Đã xóa sản phẩm!');
      loadProductsAndOrders();
    } catch {
      message.error('Xóa sản phẩm thất bại!');
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await updateAdminOrderStatus(orderId, status);
      message.success('Đã cập nhật trạng thái đơn hàng!');
      loadProductsAndOrders();
    } catch {
      message.error('Cập nhật thất bại!');
    }
  };

  useEffect(() => {
    loadData();
    loadProductsAndOrders();
    const unsub = notificationWs.subscribe(() => {
      loadDataQuietly();
      loadProductsAndOrders();
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const handleUpdateBooking = async (id, newStatus) => {
    try {
      await updateBookingStatus(id, newStatus);
      message.success(`Đã cập nhật trạng thái đơn sang ${STATUS_LABELS[newStatus]?.label || newStatus}`);
      setSelectedBooking(null);
      loadData();
    } catch (err) {
      message.error("Cập nhật trạng thái thất bại!");
    }
  };

  const handleViewStylistServices = async (stylist) => {
    setSelectedStylistName(stylist.fullName || stylist.nickname);
    setStylistServicesLoading(true);
    try {
      const sList = await getStylistServices(stylist.id);
      setSelectedStylistServices(sList || []);
    } catch (err) {
      setSelectedStylistServices([]);
    } finally {
      setStylistServicesLoading(false);
    }
  };

  const handleCreateVoucherSubmit = async (values) => {
    setCreatingVoucher(true);
    try {
      const payload = {
        voucherCode: values.voucherCode.trim().toUpperCase(),
        voucherName: values.voucherName.trim(),
        description: values.description || null,
        discountType: values.discountType,
        discountValue: Number(values.discountValue),
        maxDiscountAmount: values.maxDiscountAmount ? Number(values.maxDiscountAmount) : null,
        minOrderAmount: values.minOrderAmount ? Number(values.minOrderAmount) : 0,
        usageLimitTotal: values.usageLimitTotal ? Number(values.usageLimitTotal) : 1000,
        startDate: values.dateRange?.[0] ? values.dateRange[0].toISOString() : new Date().toISOString(),
        endDate: values.dateRange?.[1] ? values.dateRange[1].toISOString() : new Date(Date.now() + 365*86400000).toISOString(),
        isPublic: values.isPublic !== undefined ? values.isPublic : true,
      };
      await createVoucher(payload);
      message.success("Tạo voucher mới thành công!");
      setVoucherModalOpen(false);
      voucherForm.resetFields();
      loadData();
    } catch (err) {
      console.error("Create voucher error:", err);
      message.error(err.response?.data?.message || err.message || "Tạo voucher thất bại!");
    } finally {
      setCreatingVoucher(false);
    }
  };

  const handleDeleteVoucherAction = async (id) => {
    try {
      await deleteVoucher(id);
      message.success("Đã xóa voucher thành công!");
      loadData();
    } catch (err) {
      message.error("Xóa voucher thất bại!");
    }
  };

  // Calculations
  const totalRevenue = useMemo(() => {
    return bookings
      .filter((b) => b.status === "COMPLETED")
      .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  }, [bookings]);

  const pendingCount = useMemo(
    () => stats?.pending ?? stats?.pendingCount ?? bookings.filter((b) => b.status === "PENDING").length,
    [stats, bookings]
  );
  const confirmedCount = useMemo(
    () => stats?.confirmed ?? stats?.confirmedCount ?? bookings.filter((b) => b.status === "CONFIRMED").length,
    [stats, bookings]
  );
  const completedCount = useMemo(
    () => stats?.completed ?? stats?.completedCount ?? bookings.filter((b) => b.status === "COMPLETED").length,
    [stats, bookings]
  );
  const cancelledCount = useMemo(
    () => stats?.cancelled ?? stats?.cancelledCount ?? bookings.filter((b) => b.status === "CANCELLED").length,
    [stats, bookings]
  );
  const totalBookingsCount = useMemo(
    () => stats?.total ?? stats?.totalCount ?? bookings.length,
    [stats, bookings]
  );

  const completionRate = totalBookingsCount > 0 ? Math.round((completedCount / totalBookingsCount) * 100) : 0;

  // Chart period state for Admin ('day', 'week', 'month', 'year')
  const [adminTrendPeriod, setAdminTrendPeriod] = useState("week");

  // Dynamic Trend Metrics from DB Bookings and Shop Orders
  const adminTrendMetrics = useMemo(() => {
    const now = new Date();
    let startDate;

    switch (adminTrendPeriod) {
      case "day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        break;
      case "week": {
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
        startDate = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0);
        break;
      }
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0);
    }

    // Filter bookings in period
    const periodBookings = bookings.filter((b) => {
      const d = parseAnyDate(b.startTime || b.bookingDate);
      return d && d >= startDate && d <= now;
    });

    // Filter orders in period
    const periodOrders = orders.filter((o) => {
      const d = parseAnyDate(o.createdAt || o.orderDate);
      return d && d >= startDate && d <= now;
    });

    const completedBookings = periodBookings.filter((b) => b.status === "COMPLETED");
    const validOrders = periodOrders.filter(
      (o) => o.paymentStatus === "PAID" || o.orderStatus === "DELIVERED" || o.orderStatus === "COMPLETED"
    );

    const bookingRevenue = completedBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
    const orderRev = validOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const totalRev = bookingRevenue + orderRev;

    const chartData = [];

    if (adminTrendPeriod === "day") {
      // 8 time slots: 08:00 to 22:00
      const hours = [8, 10, 12, 14, 16, 18, 20, 22];
      hours.forEach((h) => {
        const slotBookings = completedBookings.filter((b) => {
          const d = parseAnyDate(b.startTime || b.bookingDate);
          return d && d.getHours() >= h && d.getHours() < h + 2;
        });
        const slotOrders = validOrders.filter((o) => {
          const d = parseAnyDate(o.createdAt || o.orderDate);
          return d && d.getHours() >= h && d.getHours() < h + 2;
        });
        const bRev = slotBookings.reduce((s, b) => s + (Number(b.totalAmount) || 0), 0);
        const oRev = slotOrders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
        const bCount = slotBookings.length;
        const oCount = slotOrders.length;
        chartData.push({
          label: `${h}h00`,
          shortLabel: `${h}h`,
          revenue: bRev + oRev,
          bookingRevenue: bRev,
          orderRevenue: oRev,
          bookingCount: bCount,
          orderCount: oCount,
          count: bCount + oCount,
        });
      });
    } else if (adminTrendPeriod === "week") {
      // 7 days: T2, T3, T4, T5, T6, T7, CN
      const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
      for (let i = 0; i < 7; i++) {
        const targetDate = new Date(startDate);
        targetDate.setDate(startDate.getDate() + i);
        const targetDateStr = targetDate.toISOString().slice(0, 10);

        const dayBookings = completedBookings.filter((b) => {
          const d = parseAnyDate(b.startTime || b.bookingDate);
          return d && d.toISOString().slice(0, 10) === targetDateStr;
        });
        const dayOrders = validOrders.filter((o) => {
          const d = parseAnyDate(o.createdAt || o.orderDate);
          return d && d.toISOString().slice(0, 10) === targetDateStr;
        });

        const bRev = dayBookings.reduce((s, b) => s + (Number(b.totalAmount) || 0), 0);
        const oRev = dayOrders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
        const bCount = dayBookings.length;
        const oCount = dayOrders.length;

        chartData.push({
          label: `${dayNames[i]} (${targetDate.getDate()}/${targetDate.getMonth() + 1})`,
          shortLabel: dayNames[i],
          revenue: bRev + oRev,
          bookingRevenue: bRev,
          orderRevenue: oRev,
          bookingCount: bCount,
          orderCount: oCount,
          count: bCount + oCount,
        });
      }
    } else if (adminTrendPeriod === "month") {
      // 4-5 weeks of current month
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const chunks = [
        { label: "Tuần 1 (1-7)", short: "Tuần 1", startDay: 1, endDay: 7 },
        { label: "Tuần 2 (8-14)", short: "Tuần 2", startDay: 8, endDay: 14 },
        { label: "Tuần 3 (15-21)", short: "Tuần 3", startDay: 15, endDay: 21 },
        { label: "Tuần 4 (22-28)", short: "Tuần 4", startDay: 22, endDay: 28 },
      ];
      if (daysInMonth > 28) {
        chunks.push({ label: `Tuần 5 (29-${daysInMonth})`, short: "Tuần 5", startDay: 29, endDay: daysInMonth });
      }

      chunks.forEach((chunk) => {
        const chunkBookings = completedBookings.filter((b) => {
          const d = parseAnyDate(b.startTime || b.bookingDate);
          return d && d.getDate() >= chunk.startDay && d.getDate() <= chunk.endDay;
        });
        const chunkOrders = validOrders.filter((o) => {
          const d = parseAnyDate(o.createdAt || o.orderDate);
          return d && d.getDate() >= chunk.startDay && d.getDate() <= chunk.endDay;
        });

        const bRev = chunkBookings.reduce((s, b) => s + (Number(b.totalAmount) || 0), 0);
        const oRev = chunkOrders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
        const bCount = chunkBookings.length;
        const oCount = chunkOrders.length;

        chartData.push({
          label: chunk.label,
          shortLabel: chunk.short,
          revenue: bRev + oRev,
          bookingRevenue: bRev,
          orderRevenue: oRev,
          bookingCount: bCount,
          orderCount: oCount,
          count: bCount + oCount,
        });
      });
    } else if (adminTrendPeriod === "year") {
      // 12 months
      for (let m = 0; m < 12; m++) {
        const monthBookings = completedBookings.filter((b) => {
          const d = parseAnyDate(b.startTime || b.bookingDate);
          return d && d.getMonth() === m && d.getFullYear() === now.getFullYear();
        });
        const monthOrders = validOrders.filter((o) => {
          const d = parseAnyDate(o.createdAt || o.orderDate);
          return d && d.getMonth() === m && d.getFullYear() === now.getFullYear();
        });

        const bRev = monthBookings.reduce((s, b) => s + (Number(b.totalAmount) || 0), 0);
        const oRev = monthOrders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
        const bCount = monthBookings.length;
        const oCount = monthOrders.length;

        chartData.push({
          label: `Tháng ${m + 1}`,
          shortLabel: `T${m + 1}`,
          revenue: bRev + oRev,
          bookingRevenue: bRev,
          orderRevenue: oRev,
          bookingCount: bCount,
          orderCount: oCount,
          count: bCount + oCount,
        });
      }
    }

    return {
      revenue: totalRev,
      bookingRevenue,
      orderRevenue: orderRev,
      bookingsCount: periodBookings.length,
      completedBookingsCount: completedBookings.length,
      ordersCount: periodOrders.length,
      validOrdersCount: validOrders.length,
      totalTransactions: completedBookings.length + validOrders.length,
      chartData,
    };
  }, [adminTrendPeriod, bookings, orders]);

  // Dynamic Top Services from Real DB Bookings
  const topServicesData = useMemo(() => {
    const serviceCounts = {};
    bookings.forEach((b) => {
      const sName = b.serviceName || "Dịch vụ Salon";
      if (!serviceCounts[sName]) {
        serviceCounts[sName] = { name: sName, count: 0, rev: 0 };
      }
      serviceCounts[sName].count += 1;
      if (b.status === "COMPLETED") {
        serviceCounts[sName].rev += Number(b.totalAmount) || 0;
      }
    });
    const list = Object.values(serviceCounts).sort((a, b) => b.count - a.count).slice(0, 5);
    const maxCount = list[0]?.count || 1;
    const colors = ["#1890ff", "#52c41a", "#722ed1", "#faad14", "#eb2f96"];
    return list.map((item, idx) => ({
      ...item,
      percent: Math.round((item.count / maxCount) * 100),
      color: colors[idx % colors.length],
    }));
  }, [bookings]);

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch =
        !bookingSearch ||
        (b.bookingCode && b.bookingCode.toLowerCase().includes(bookingSearch.toLowerCase())) ||
        (b.customerName && b.customerName.toLowerCase().includes(bookingSearch.toLowerCase())) ||
        (b.customerPhone && b.customerPhone.includes(bookingSearch));
      const matchStatus = bookingStatusFilter === "ALL" || b.status === bookingStatusFilter;
      const matchSalon = bookingSalonFilter === "ALL" || b.salonId === bookingSalonFilter;
      return matchSearch && matchStatus && matchSalon;
    });
  }, [bookings, bookingSearch, bookingStatusFilter, bookingSalonFilter]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !userSearch ||
        (u.fullName && u.fullName.toLowerCase().includes(userSearch.toLowerCase())) ||
        (u.username && u.username.toLowerCase().includes(userSearch.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase())) ||
        (u.phoneNumber && u.phoneNumber.includes(userSearch));
      const matchTier = userTierFilter === "ALL" || u.membershipTier === userTierFilter;
      return matchSearch && matchTier;
    });
  }, [users, userSearch, userTierFilter]);

  // Sidebar Menu Items
  const menuItems = [
    { key: "overview", icon: <DashboardOutlined />, label: "Tổng quan" },
    { key: "bookings", icon: <CalendarOutlined />, label: `Lịch hẹn (${bookings.length})` },
    { key: "users", icon: <UserOutlined />, label: `Khách hàng (${users.length})` },
    { key: "stylists", icon: <ScissorOutlined />, label: `Stylist (${stylists.length})` },
    { key: "salons", icon: <ShopOutlined />, label: `Salon (${salons.length})` },
    { key: "vouchers", icon: <GiftOutlined />, label: `Quản lý Voucher (${vouchers.length})` },
    { key: "stats", icon: <BarChartOutlined />, label: "Phân tích & Báo cáo" },
    { key: "products", icon: <ShopOutlined />, label: "Quản lý sản phẩm" },
    { key: "orders", icon: <DollarOutlined />, label: "Quản lý đơn hàng" },
    { key: "reviews", icon: <StarOutlined />, label: `Đánh giá Shop (${reviews.length})` },
    { type: "divider" },
    { key: "settings", icon: <SettingOutlined />, label: "Cài đặt hệ thống" },
    { key: "logout", icon: <LogoutOutlined />, label: "Đăng xuất", danger: true },
  ];

  // Booking Table Columns
  const BOOKING_COLUMNS = [
    {
      title: "Mã đặt lịch",
      dataIndex: "bookingCode",
      key: "bookingCode",
      render: (v) => <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">{v || "—"}</span>,
    },
    {
      title: "Khách hàng",
      dataIndex: "customerName",
      key: "customerName",
      render: (v, r) => (
        <div>
          <p className="font-bold text-gray-800 text-sm mb-0">{v || "Khách vãng lai"}</p>
          <p className="text-gray-400 text-xs mb-0">{r.customerPhone || "—"}</p>
        </div>
      ),
    },
    {
      title: "Stylist & Chi nhánh",
      key: "stylist_salon",
      render: (_, r) => (
        <div>
          <p className="font-semibold text-gray-700 text-xs mb-0">✂️ {r.stylistName || "Stylist phân bổ"}</p>
          <p className="text-gray-400 text-xs mb-0">📍 {r.salonName || "Chi nhánh chính"}</p>
        </div>
      ),
    },
    {
      title: "Thời gian",
      dataIndex: "startTime",
      key: "startTime",
      render: (v) => <span className="text-xs text-gray-600">{formatDate(v)}</span>,
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (v) => <span className="font-bold text-amber-700 text-sm">{formatCurrency(v)}</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (v) => {
        const s = STATUS_LABELS[v] ?? { label: v, color: "default" };
        return <Badge status={s.antStatus || "default"} text={<span className="text-xs font-semibold">{s.label}</span>} />;
      },
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, r) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setSelectedBooking(r)}
            className="text-xs"
          >
            Chi tiết
          </Button>
          {r.status === "PENDING" && (
            <Button
              size="small"
              type="primary"
              onClick={() => handleUpdateBooking(r.id, "CONFIRMED")}
              className="text-xs bg-blue-600"
            >
              Duyệt
            </Button>
          )}
          {r.status === "CONFIRMED" && (
            <Button
              size="small"
              type="primary"
              onClick={() => handleUpdateBooking(r.id, "COMPLETED")}
              className="text-xs bg-green-600"
            >
              Hoàn thành
            </Button>
          )}
        </div>
      ),
    },
  ];

  // User Table Columns
  const USER_COLUMNS = [
    {
      title: "Khách hàng",
      dataIndex: "fullName",
      key: "fullName",
      render: (v, r) => (
        <div className="flex items-center gap-3">
          <Avatar size={36} src={r.avatarUrl} icon={<UserOutlined />} className="border border-gray-200" />
          <div>
            <p className="font-bold text-sm text-gray-800 mb-0">{v || r.username || "Khách hàng"}</p>
            <p className="text-gray-400 text-xs mb-0">@{r.username}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Liên hệ",
      key: "contact",
      render: (_, r) => (
        <div>
          <p className="text-xs text-gray-700 mb-0">📞 {r.phoneNumber || "Chưa cập nhật"}</p>
          <p className="text-xs text-gray-400 mb-0">✉️ {r.email || "—"}</p>
        </div>
      ),
    },
    {
      title: "Hạng thành viên",
      dataIndex: "membershipTier",
      key: "membershipTier",
      render: (v) => {
        const TIER_COLORS = { VIP: "gold", GOLD: "orange", SILVER: "blue", STANDARD: "cyan" };
        return <Tag color={TIER_COLORS[v] ?? "cyan"} className="font-bold text-xs">{v || "STANDARD"}</Tag>;
      },
    },
    {
      title: "Mã Voucher / Ưu đãi",
      dataIndex: "voucherCode",
      key: "voucherCode",
      render: (v) => v ? <Tag color="purple" className="font-mono text-xs">{v}</Tag> : <span className="text-gray-400 text-xs">—</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (v) => (
        <Tag color={v === "ACTIVE" || !v ? "success" : "error"} className="text-xs">
          {v === "ACTIVE" || !v ? "HOẠT ĐỘNG" : "BỊ KHÓA"}
        </Tag>
      ),
    },
  ];

  // Voucher Table Columns
  const VOUCHER_COLUMNS = [
    {
      title: "Mã Voucher",
      dataIndex: "voucherCode",
      key: "voucherCode",
      render: (v) => (
        <span className="font-mono text-xs font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
          {v}
        </span>
      ),
    },
    {
      title: "Chương trình ưu đãi",
      dataIndex: "voucherName",
      key: "voucherName",
      render: (v, r) => (
        <div>
          <p className="font-bold text-sm text-gray-900 mb-0">{v}</p>
          <p className="text-xs text-gray-400 mb-0">{r.description || "Ưu đãi dịch vụ làm tóc"}</p>
        </div>
      ),
    },
    {
      title: "Mức giảm",
      key: "discount",
      render: (_, r) => (
        <div>
          <span className="font-black text-rose-600 text-sm">
            {r.discountType === "PERCENT"
              ? `Giảm ${r.discountValue}%`
              : `-${formatCurrency(r.discountValue)}`}
          </span>
          {r.discountType === "PERCENT" && r.maxDiscountAmount && (
            <p className="text-[11px] text-gray-400 mb-0">
              Tối đa {formatCurrency(r.maxDiscountAmount)}
            </p>
          )}
          {r.minOrderAmount > 0 && (
            <p className="text-[11px] text-gray-400 mb-0">
              Đơn từ {formatCurrency(r.minOrderAmount)}
            </p>
          )}
        </div>
      ),
    },
    {
      title: "Lượt sử dụng",
      key: "usage",
      render: (_, r) => {
        const used = r.usedCount || 0;
        const total = r.usageLimitTotal || 1000;
        const percent = Math.min(100, Math.round((used / total) * 100));
        return (
          <div className="w-28">
            <div className="flex justify-between text-[11px] mb-1 text-gray-600 font-semibold">
              <span>{used} / {total}</span>
              <span>{percent}%</span>
            </div>
            <Progress percent={percent} size="small" showInfo={false} status={percent >= 90 ? "exception" : "normal"} />
          </div>
        );
      },
    },
    {
      title: "Thời hạn áp dụng",
      key: "validity",
      render: (_, r) => (
        <div className="text-xs text-gray-600">
          <p className="mb-0">Từ: {r.startDate ? new Date(r.startDate).toLocaleDateString("vi-VN") : "Hôm nay"}</p>
          <p className="mb-0">Đến: {r.endDate ? new Date(r.endDate).toLocaleDateString("vi-VN") : "Vô thời hạn"}</p>
        </div>
      ),
    },
    {
      title: "Phạm vi",
      dataIndex: "isPublic",
      key: "isPublic",
      render: (v) => (
        <Tag color={v ? "blue" : "gold"} className="text-xs font-semibold">
          {v ? "Công khai" : "Riêng tư"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, r) => (
        <Popconfirm
          title="Xóa voucher này?"
          description={`Bạn có chắc muốn xóa mã ${r.voucherCode}?`}
          onConfirm={() => handleDeleteVoucherAction(r.id)}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" className="rounded-lg">
            Xóa
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Layout className="min-h-screen bg-gray-50">
      {/* ── SIDEBAR ──────────────────────────────────────────────── */}
      <Sider
        width={250}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        className="shadow-md border-r border-gray-100"
      >
        {/* Brand */}
        {!collapsed && (
          <div className="flex flex-col items-center py-6 px-4 border-b border-gray-100 bg-white">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-500 rounded-2xl flex items-center justify-center mb-2.5 shadow-md">
              <BankOutlined className="text-white text-2xl" />
            </div>
            <span className="text-gray-900 font-black text-sm tracking-widest uppercase">
              ADMIN PORTAL
            </span>
            <span className="text-gray-400 text-xs font-semibold">BachBarber Hair Salon</span>
          </div>
        )}

        {/* Admin info */}
        {!collapsed && (
          <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-slate-50/60">
            <Avatar
              size={44}
              src={userInfo?.avatarUrl}
              icon={!userInfo?.avatarUrl ? <UserOutlined /> : null}
              className="border-2 border-amber-500"
            />
            <div className="overflow-hidden">
              <p className="font-bold text-gray-800 text-xs truncate mb-0.5">
                {userInfo?.fullName || userInfo?.username || "Quản trị viên"}
              </p>
              <Tag color="gold" className="text-[10px] font-bold px-1.5 py-0 leading-none">
                QUẢN TRỊ VIÊN
              </Tag>
            </div>
          </div>
        )}

        <Menu
          mode="inline"
          selectedKeys={[activeSection]}
          items={menuItems}
          onClick={({ key }) => {
            if (key === "logout") handleLogout();
            else setActiveSection(key);
          }}
          className="border-none pt-2"
        />
      </Sider>

      {/* ── MAIN CONTENT AREA ────────────────────────────────────── */}
      <Layout>
        {/* Header */}
        <Header className="bg-white px-8 flex items-center justify-between shadow-sm border-b border-gray-100 h-16">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-black text-gray-800 mb-0">
              {activeSection === "overview" && "Tổng quan hệ thống"}
              {activeSection === "bookings" && "Quản lý Lịch hẹn toàn chuỗi"}
              {activeSection === "users" && "Quản lý Khách hàng & Hội viên"}
              {activeSection === "stylists" && "Đội ngũ Stylist chuyên nghiệp"}
              {activeSection === "salons" && "Danh sách Chi nhánh Salon"}
              {activeSection === "vouchers" && "Quản lý Chương trình Ưu đãi & Voucher"}
              {activeSection === "stats" && "Báo cáo phân tích doanh thu & vận hành"}
              {activeSection === "products" && "Quản lý sản phẩm Shop"}
              {activeSection === "orders" && "Quản lý đơn hàng Shop"}
              {activeSection === "reviews" && "Đánh giá & Thống kê phản hồi sản phẩm"}
              {activeSection === "settings" && "Cấu hình vận hành salon"}
            </h1>
            <Tag color="blue" className="text-xs">v2.5 Enterprise</Tag>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Sync WebSocket</span>
            </div>
            <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
              <Avatar
                size={34}
                src={userInfo?.avatarUrl}
                icon={!userInfo?.avatarUrl ? <UserOutlined /> : null}
              />
              <span className="text-xs font-bold text-gray-700 hidden sm:block">
                {userInfo?.fullName || userInfo?.username}
              </span>
            </div>
          </div>
        </Header>

        {/* Content */}
        <Content className="p-6 md:p-8 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-32">
              <Spin size="large" tip="Đang tải dữ liệu hệ thống..." />
            </div>
          ) : (
            <>
              {/* ═══════════════════════════════════════════════════════ */}
              {/* VIEW 1: OVERVIEW                                        */}
              {/* ═══════════════════════════════════════════════════════ */}
              {activeSection === "overview" && (
                <div className="space-y-6">
                  {/* Top Stats Cards */}
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} lg={6}>
                      <Card className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50/70 to-white">
                        <Statistic
                          title={<span className="text-xs font-bold uppercase text-blue-700 tracking-wider">Tổng lịch đặt</span>}
                          value={totalBookingsCount}
                          suffix={<span className="text-xs text-gray-400 font-normal">lịch</span>}
                          prefix={<CalendarOutlined className="text-blue-500 mr-1" />}
                          valueStyle={{ fontWeight: 900, color: "#1e3a8a" }}
                        />
                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                          <span>Chờ duyệt: <strong className="text-amber-600">{pendingCount}</strong></span>
                          <span>Đã xác nhận: <strong className="text-blue-600">{confirmedCount}</strong></span>
                        </div>
                      </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                      <Card className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-green-50/70 to-white">
                        <Statistic
                          title={<span className="text-xs font-bold uppercase text-green-700 tracking-wider">Doanh thu hoàn tất</span>}
                          value={totalRevenue}
                          formatter={(v) => formatCurrency(v)}
                          prefix={<DollarOutlined className="text-green-500 mr-1" />}
                          valueStyle={{ fontWeight: 900, color: "#14532d" }}
                        />
                        <div className="mt-3 flex items-center gap-1 text-xs text-green-600 font-semibold">
                          <ArrowUpOutlined />
                          <span>Đã phục vụ xong {completedCount} khách</span>
                        </div>
                      </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                      <Card className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-purple-50/70 to-white">
                        <Statistic
                          title={<span className="text-xs font-bold uppercase text-purple-700 tracking-wider">Khách hàng thành viên</span>}
                          value={users.length}
                          suffix={<span className="text-xs text-gray-400 font-normal">người</span>}
                          prefix={<TeamOutlined className="text-purple-500 mr-1" />}
                          valueStyle={{ fontWeight: 900, color: "#581c87" }}
                        />
                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                          <span>VIP / Gold: <strong>{users.filter(u => u.membershipTier === 'VIP' || u.membershipTier === 'GOLD').length}</strong></span>
                          <span className="text-purple-600">Đang hoạt động</span>
                        </div>
                      </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                      <Card className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-amber-50/70 to-white">
                        <Statistic
                          title={<span className="text-xs font-bold uppercase text-amber-700 tracking-wider">Quy mô hệ thống</span>}
                          value={salons.length}
                          suffix={<span className="text-xs text-gray-400 font-normal">chi nhánh</span>}
                          prefix={<ShopOutlined className="text-amber-500 mr-1" />}
                          valueStyle={{ fontWeight: 900, color: "#78350f" }}
                        />
                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                          <span>Stylists: <strong>{stylists.length}</strong> thợ</span>
                          <Tag color="success" className="text-[10px]">Tất cả mở cửa</Tag>
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  {/* ── ANT DESIGN ANALYTICAL CHARTS SECTION ── */}
                  <Row gutter={[16, 16]}>
                    {/* Revenue Trend Analytical Chart */}
                    <Col xs={24} lg={16}>
                      <Card
                        title={
                          <div className="flex items-center justify-between py-1">
                            <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                              <RiseOutlined className="text-blue-500" />
                              Biểu đồ đánh giá & phân tích Doanh thu toàn hệ thống
                            </span>
                            <Tag color="blue">Dịch vụ & Shop Sản phẩm</Tag>
                          </div>
                        }
                        className="rounded-2xl border-gray-100 shadow-sm"
                      >
                        {/* Dropdown phân loại theo: Ngày, Tuần, Tháng, Năm nằm ngay phía trên chart */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
                          <div>
                            <h4 className="text-sm font-bold text-gray-800 mb-0">Xu hướng Doanh thu & Lượt giao dịch</h4>
                            <p className="text-xs text-gray-400 mb-0">Tổng hợp dữ liệu thực tế từ Lịch đặt Salon và Đơn hàng Shop</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500">Phân loại theo kỳ:</span>
                            <Select
                              value={adminTrendPeriod}
                              onChange={setAdminTrendPeriod}
                              className="w-48"
                              size="middle"
                            >
                              <Option value="day">📅 Hôm nay (Ngày)</Option>
                              <Option value="week">📊 Tuần này (Tuần)</Option>
                              <Option value="month">🗓️ Tháng này (Tháng)</Option>
                              <Option value="year">📈 Năm nay (Năm)</Option>
                            </Select>
                          </div>
                        </div>

                        {/* 4 Mini metric cards for selected period */}
                        <Row gutter={[12, 12]} className="mb-4">
                          {[
                            { label: 'Tổng doanh thu kỳ', value: formatCurrency(adminTrendMetrics.revenue), color: 'text-blue-700', bg: 'bg-blue-50', icon: '💰' },
                            { label: 'Dịch vụ Salon', value: formatCurrency(adminTrendMetrics.bookingRevenue), color: 'text-sky-700', bg: 'bg-sky-50', icon: '✂️' },
                            { label: 'Shop Sản phẩm', value: formatCurrency(adminTrendMetrics.orderRevenue), color: 'text-purple-700', bg: 'bg-purple-50', icon: '🛍️' },
                            { label: 'Tổng giao dịch', value: `${adminTrendMetrics.totalTransactions} lượt`, color: 'text-emerald-700', bg: 'bg-emerald-50', icon: '📊' },
                          ].map(({label, value, color, bg, icon}) => (
                            <Col xs={12} sm={6} key={label}>
                              <div className={`${bg} rounded-xl p-3 text-center border border-gray-100`}>
                                <div className="text-xl mb-1">{icon}</div>
                                <div className={`text-sm sm:text-base font-black ${color}`}>{value}</div>
                                <div className="text-[11px] text-gray-500">{label}</div>
                              </div>
                            </Col>
                          ))}
                        </Row>

                        {/* SVG Line Chart for Period */}
                        {(() => {
                          const chartData = adminTrendMetrics.chartData || [];
                          const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1000000);
                          const maxCount = Math.max(...chartData.map((d) => d.count), 5);
                          const svgWidth = 720;
                          const svgHeight = 220;
                          const padX = 50;
                          const padY = 25;
                          const plotW = svgWidth - 2 * padX;
                          const plotH = svgHeight - 2 * padY;

                          const pointsRev = chartData.map((d, i) => ({
                            x: padX + (i / Math.max(chartData.length - 1, 1)) * plotW,
                            y: padY + (1 - (d.revenue / maxRevenue)) * (plotH - 25),
                            ...d,
                          }));

                          const pointsCount = chartData.map((d, i) => ({
                            x: padX + (i / Math.max(chartData.length - 1, 1)) * plotW,
                            y: padY + (1 - (d.count / maxCount)) * (plotH - 25),
                            ...d,
                          }));

                          const linePathRev = generateSvgPath(pointsRev);
                          const areaPathRev = generateAreaPath(pointsRev, svgHeight - padY - 10);
                          const linePathCount = generateSvgPath(pointsCount);

                          return (
                            <div className="bg-slate-50/70 p-4 rounded-2xl border border-gray-100">
                              {/* Legend & Summary */}
                              <div className="flex flex-wrap items-center justify-between mb-3 text-xs gap-2">
                                <div className="flex items-center gap-5">
                                  <div className="flex items-center gap-2 font-bold text-blue-600">
                                    <span className="w-5 h-1 bg-blue-600 rounded-full inline-block" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block -ml-3.5 border-2 border-white" />
                                    <span>Đường Doanh thu tổng (VNĐ)</span>
                                  </div>
                                  <div className="flex items-center gap-2 font-bold text-emerald-600">
                                    <span className="w-5 h-1 bg-emerald-500 rounded-full inline-block border-t border-dashed" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block -ml-3.5 border-2 border-white" />
                                    <span>Đường Lượt giao dịch (Lịch + Đơn)</span>
                                  </div>
                                </div>
                                <span className="text-gray-400 font-medium text-[11px]">
                                  Đỉnh điểm doanh thu: <strong className="text-blue-600">{formatCurrency(maxRevenue)}</strong>
                                </span>
                              </div>

                              <div className="relative w-full overflow-x-auto">
                                <div className="min-w-[620px]">
                                  <svg className="w-full h-64 overflow-visible" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
                                    <defs>
                                      <linearGradient id="adminRevAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.01" />
                                      </linearGradient>
                                    </defs>

                                    {/* Horizontal Grid lines */}
                                    {[35, 75, 115, 155].map((y, idx) => (
                                      <g key={idx}>
                                        <line x1="45" y1={y} x2={svgWidth - 40} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                                        <text x="35" y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
                                          {idx === 0 ? `${(maxRevenue / 1000).toFixed(0)}k` : idx === 3 ? '0' : ''}
                                        </text>
                                      </g>
                                    ))}

                                    {/* Revenue Area Gradient Fill */}
                                    {areaPathRev && <path d={areaPathRev} fill="url(#adminRevAreaGrad)" />}

                                    {/* Revenue Smooth Line Curve */}
                                    {linePathRev && (
                                      <path
                                        d={linePathRev}
                                        fill="none"
                                        stroke="#2563eb"
                                        strokeWidth="3.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    )}

                                    {/* Transactions Count Line Curve */}
                                    {linePathCount && (
                                      <path
                                        d={linePathCount}
                                        fill="none"
                                        stroke="#10b981"
                                        strokeWidth="2.5"
                                        strokeDasharray="5 3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    )}

                                    {/* Interactive Data Nodes with Tooltips */}
                                    {pointsRev.map((pt, idx) => {
                                      const countPt = pointsCount[idx] || pt;
                                      return (
                                        <g key={idx}>
                                          {/* Vertical hover guide bar */}
                                          <line
                                            x1={pt.x}
                                            y1={30}
                                            x2={pt.x}
                                            y2={svgHeight - padY - 10}
                                            stroke="#cbd5e1"
                                            strokeWidth="1"
                                            strokeDasharray="2 2"
                                            opacity="0.4"
                                          />

                                          {/* Revenue Node Point */}
                                          <Tooltip
                                            title={
                                              <div className="p-1">
                                                <p className="font-bold mb-1 text-white text-xs border-b border-gray-600 pb-1">{pt.label}</p>
                                                <p className="text-xs text-sky-200 mb-0.5">💰 Tổng doanh thu: <strong>{formatCurrency(pt.revenue)}</strong></p>
                                                <p className="text-[11px] text-gray-300 mb-0.5">✂️ Salon: {formatCurrency(pt.bookingRevenue)} ({pt.bookingCount} lịch)</p>
                                                <p className="text-[11px] text-gray-300 mb-0.5">🛍️ Shop: {formatCurrency(pt.orderRevenue)} ({pt.orderCount} đơn)</p>
                                                <p className="text-xs text-emerald-200 mb-0 font-semibold">📊 Tổng giao dịch: <strong>{pt.count}</strong></p>
                                              </div>
                                            }
                                          >
                                            <circle
                                              cx={pt.x}
                                              cy={pt.y}
                                              r="5"
                                              fill="#2563eb"
                                              stroke="#ffffff"
                                              strokeWidth="2.5"
                                              className="cursor-pointer hover:scale-125 transition-transform"
                                            />
                                          </Tooltip>

                                          {/* Count Node Point */}
                                          <Tooltip title={`${pt.label}: ${pt.count} giao dịch (${pt.bookingCount} lịch hẹn, ${pt.orderCount} đơn hàng)`}>
                                            <circle
                                              cx={countPt.x}
                                              cy={countPt.y}
                                              r="4"
                                              fill="#10b981"
                                              stroke="#ffffff"
                                              strokeWidth="2"
                                              className="cursor-pointer hover:scale-125 transition-transform"
                                            />
                                          </Tooltip>

                                          {/* X Axis Label */}
                                          <text
                                            x={pt.x}
                                            y={svgHeight - 10}
                                            textAnchor="middle"
                                            fontSize="10"
                                            fontWeight="600"
                                            fill="#64748b"
                                          >
                                            {pt.shortLabel || pt.label}
                                          </text>
                                        </g>
                                      );
                                    })}
                                  </svg>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs text-gray-500 mt-4 px-2">
                                <div className="flex items-center gap-4">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                                    Doanh thu thực tế từ DB
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                                    Giao dịch hoàn tất
                                  </span>
                                </div>
                                <span>
                                  Doanh thu TB: <strong>{formatCurrency(chartData.length > 0 ? Math.round(adminTrendMetrics.revenue / Math.max(chartData.length, 1)) : 0)} / mốc</strong>
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </Card>
                    </Col>

                    {/* Status Breakdown & Gauge Chart */}
                    <Col xs={24} lg={8}>
                      <Card
                        title={
                          <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                            <BarChartOutlined className="text-amber-500" />
                            Tỉ lệ thực hiện lịch hẹn
                          </span>
                        }
                        className="rounded-2xl border-gray-100 shadow-sm h-full flex flex-col justify-between"
                      >
                        <div className="flex flex-col items-center justify-center py-2">
                          <Progress
                            type="dashboard"
                            percent={completionRate}
                            strokeColor={{
                              "0%": "#108ee9",
                              "100%": "#87d068",
                            }}
                            format={(percent) => (
                              <div className="text-center">
                                <span className="text-2xl font-black text-gray-800">{percent}%</span>
                                <div className="text-[11px] text-gray-400">Hoàn thành</div>
                              </div>
                            )}
                            size={160}
                          />

                          <div className="w-full mt-4 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1.5 text-gray-600">
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Đã hoàn thành
                              </span>
                              <strong>{completedCount} lịch ({completionRate}%)</strong>
                            </div>
                            <Progress percent={completionRate} showInfo={false} strokeColor="#52c41a" size="small" />

                            <div className="flex items-center justify-between text-xs pt-1">
                              <span className="flex items-center gap-1.5 text-gray-600">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Đã xác nhận / Đang cắt
                              </span>
                              <strong>{confirmedCount} lịch</strong>
                            </div>
                            <Progress
                              percent={totalBookingsCount > 0 ? Math.round((confirmedCount / totalBookingsCount) * 100) : 0}
                              showInfo={false}
                              strokeColor="#1890ff"
                              size="small"
                            />

                            <div className="flex items-center justify-between text-xs pt-1">
                              <span className="flex items-center gap-1.5 text-gray-600">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Chờ xác nhận
                              </span>
                              <strong>{pendingCount} lịch</strong>
                            </div>
                            <Progress
                              percent={totalBookingsCount > 0 ? Math.round((pendingCount / totalBookingsCount) * 100) : 0}
                              showInfo={false}
                              strokeColor="#faad14"
                              size="small"
                            />
                          </div>
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  {/* Salon Performance & Recent Activity */}
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={10}>
                      <Card
                        title={
                          <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                            <ShopOutlined className="text-purple-500" />
                            Phân bổ theo Chi nhánh Salon
                          </span>
                        }
                        className="rounded-2xl border-gray-100 shadow-sm"
                      >
                        <div className="space-y-4 py-1">
                          {salons.map((salon, i) => {
                            const salonBookings = bookings.filter((b) => b.salonId === salon.id);
                            const salonRev = salonBookings
                              .filter((b) => b.status === "COMPLETED")
                              .reduce((s, b) => s + (Number(b.totalAmount) || 0), 0);
                            const percent = totalRevenue > 0 ? Math.round((salonRev / totalRevenue) * 100) : 33;
                            return (
                              <div key={salon.id || i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="font-bold text-xs text-gray-800">{salon.salonName}</span>
                                  <span className="font-bold text-xs text-amber-700">{formatCurrency(salonRev)}</span>
                                </div>
                                <Progress percent={percent} strokeColor="#722ed1" size="small" />
                                <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
                                  <span>{salon.city}</span>
                                  <span>{salonBookings.length} lịch đặt</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    </Col>

                    <Col xs={24} lg={14}>
                      <Card
                        title={
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                              <CalendarOutlined className="text-blue-500" />
                              Lịch đặt gần đây nhất
                            </span>
                            <Button type="link" size="small" onClick={() => setActiveSection("bookings")}>
                              Xem tất cả ({bookings.length})
                            </Button>
                          </div>
                        }
                        className="rounded-2xl border-gray-100 shadow-sm"
                      >
                        <Table
                          dataSource={bookings.slice(0, 5)}
                          columns={BOOKING_COLUMNS.slice(0, 6)}
                          rowKey={(r) => r.id || r.bookingCode}
                          pagination={false}
                          size="small"
                        />
                      </Card>
                    </Col>
                  </Row>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════ */}
              {/* VIEW 2: BOOKINGS MANAGEMENT                             */}
              {/* ═══════════════════════════════════════════════════════ */}
              {activeSection === "bookings" && (
                <div className="space-y-4">
                  <Card className="rounded-2xl border-gray-100 shadow-sm">
                    {/* Filters Bar */}
                    <div className="flex flex-col md:flex-row gap-3 items-center justify-between mb-4">
                      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <Input
                          placeholder="Tìm mã lịch, tên khách, SĐT..."
                          prefix={<SearchOutlined className="text-gray-400" />}
                          value={bookingSearch}
                          onChange={(e) => setBookingSearch(e.target.value)}
                          allowClear
                          className="w-full sm:w-64 rounded-xl"
                        />

                        <Select
                          value={bookingStatusFilter}
                          onChange={setBookingStatusFilter}
                          className="w-40"
                        >
                          <Option value="ALL">Tất cả trạng thái</Option>
                          <Option value="PENDING">Chờ xác nhận</Option>
                          <Option value="CONFIRMED">Đã xác nhận</Option>
                          <Option value="COMPLETED">Đã hoàn thành</Option>
                          <Option value="CANCELLED">Đã hủy</Option>
                        </Select>

                        <Select
                          value={bookingSalonFilter}
                          onChange={setBookingSalonFilter}
                          className="w-48"
                        >
                          <Option value="ALL">Tất cả chi nhánh</Option>
                          {salons.map((s) => (
                            <Option key={s.id} value={s.id}>{s.salonName}</Option>
                          ))}
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <Tag color="gold">Chờ duyệt: {pendingCount}</Tag>
                        <Tag color="processing">Đã xác nhận: {confirmedCount}</Tag>
                        <Tag color="success">Hoàn thành: {completedCount}</Tag>
                      </div>
                    </div>

                    {/* Bookings Table */}
                    <Table
                      dataSource={filteredBookings}
                      columns={BOOKING_COLUMNS}
                      rowKey={(r) => r.id || r.bookingCode}
                      pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `Tổng ${total} lịch hẹn` }}
                      className="border border-gray-100 rounded-xl overflow-hidden"
                    />
                  </Card>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════ */}
              {/* VIEW 3: USERS MANAGEMENT                                */}
              {/* ═══════════════════════════════════════════════════════ */}
              {activeSection === "users" && (
                <div className="space-y-4">
                  <Card className="rounded-2xl border-gray-100 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-3 items-center justify-between mb-4">
                      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <Input
                          placeholder="Tìm tên, username, email, SĐT..."
                          prefix={<SearchOutlined className="text-gray-400" />}
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          allowClear
                          className="w-full sm:w-72 rounded-xl"
                        />

                        <Select
                          value={userTierFilter}
                          onChange={setUserTierFilter}
                          className="w-44"
                        >
                          <Option value="ALL">Tất cả hạng thẻ</Option>
                          <Option value="VIP">Hạng VIP</Option>
                          <Option value="GOLD">Hạng Vàng (Gold)</Option>
                          <Option value="SILVER">Hạng Bạc (Silver)</Option>
                          <Option value="STANDARD">Hạng Chuẩn (Standard)</Option>
                        </Select>
                      </div>

                      <div className="text-xs text-gray-500">
                        Hiển thị <strong>{filteredUsers.length}</strong> / {users.length} tài khoản khách hàng
                      </div>
                    </div>

                    <Table
                      dataSource={filteredUsers}
                      columns={USER_COLUMNS}
                      rowKey={(r) => r.id || r.username}
                      pagination={{ pageSize: 8, showSizeChanger: true }}
                      className="border border-gray-100 rounded-xl overflow-hidden"
                    />
                  </Card>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════ */}
              {/* VIEW 4: STYLISTS MANAGEMENT                             */}
              {/* ═══════════════════════════════════════════════════════ */}
              {activeSection === "stylists" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-gray-800 mb-0">Đội ngũ {stylists.length} Master & Senior Stylists</h2>
                      <p className="text-xs text-gray-400 mb-0">Được đồng bộ và phân bổ trực tiếp tại các chi nhánh</p>
                    </div>
                    <Tag color="geekblue" className="text-xs">Đang hoạt động 100%</Tag>
                  </div>

                  <Row gutter={[16, 16]}>
                    {stylists.map((s) => (
                      <Col key={s.id} xs={24} sm={12} lg={8}>
                        <Card
                          hoverable
                          className="rounded-2xl border-gray-100 shadow-sm overflow-hidden h-full flex flex-col justify-between"
                        >
                          <div>
                            {/* Card Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <Avatar
                                  size={54}
                                  src={s.avatarUrl}
                                  icon={<UserOutlined />}
                                  className="border-2 border-amber-500 shadow-sm"
                                />
                                <div>
                                  <h3 className="font-bold text-base text-gray-900 mb-0.5">{s.fullName}</h3>
                                  <span className="text-xs text-amber-600 font-semibold">@{s.nickname || s.username}</span>
                                </div>
                              </div>
                              <Tag
                                color={s.levelRank === "MASTER" ? "gold" : s.levelRank === "SENIOR" ? "blue" : "default"}
                                className="font-black text-xs uppercase"
                              >
                                {s.levelRank || "STYLIST"}
                              </Tag>
                            </div>

                            {/* Bio & Details */}
                            <p className="text-xs text-gray-600 line-clamp-2 italic mb-3">
                              "{s.bio || "Chuyên gia tạo mẫu tóc chuyên nghiệp tại BachBarber."}"
                            </p>

                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1.5 text-xs text-gray-600 mb-4">
                              <div className="flex items-center justify-between">
                                <span>📍 Chi nhánh:</span>
                                <strong className="text-gray-800">{s.salonName || "Hà Nội"}</strong>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>⭐ Đánh giá:</span>
                                <strong className="text-amber-500">{Number(s.ratingAverage || 4.8).toFixed(1)} ★ ({s.totalReviewsCount || 0} reviews)</strong>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>✂️ Đã phục vụ:</span>
                                <strong className="text-blue-600">{s.totalServedBookings || 0} lượt khách</strong>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>💼 Hoa hồng:</span>
                                <strong className="text-green-600">{s.commissionRate || 20}%</strong>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>🕒 Ca làm việc:</span>
                                <Tag color="cyan" className="text-[10px] m-0">{s.workShiftType || "FULL_TIME"}</Tag>
                              </div>
                            </div>
                          </div>

                          <Button
                            type="primary"
                            icon={<ScissorOutlined />}
                            onClick={() => handleViewStylistServices(s)}
                            className="w-full bg-[#1b2a4a] hover:bg-[#244383] font-bold rounded-xl h-10 shadow-sm"
                          >
                            Xem dịch vụ phụ trách
                          </Button>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════ */}
              {/* VIEW 5: SALONS MANAGEMENT                               */}
              {/* ═══════════════════════════════════════════════════════ */}
              {activeSection === "salons" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-gray-800 mb-0">Hệ thống {salons.length} chi nhánh BachBarber</h2>
                      <p className="text-xs text-gray-400 mb-0">Hà Nội & TP. Hồ Chí Minh</p>
                    </div>
                  </div>

                  <Row gutter={[16, 16]}>
                    {salons.map((salon) => {
                      const salonStylists = stylists.filter((s) => s.salonId === salon.id);
                      const salonBookings = bookings.filter((b) => b.salonId === salon.id);
                      return (
                        <Col key={salon.id} xs={24} md={12} lg={8}>
                          <Card className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-12 h-12 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl flex items-center justify-center text-xl shadow-sm">
                                <ShopOutlined />
                              </div>
                              <div>
                                <h3 className="font-bold text-base text-gray-900 mb-0">{salon.salonName}</h3>
                                <span className="text-xs text-gray-400">Khu vực: {salon.city}</span>
                              </div>
                            </div>

                            <div className="space-y-2 text-xs text-gray-600 mb-4 bg-slate-50/70 p-3.5 rounded-xl border border-gray-100">
                              <p className="mb-0 flex items-start gap-1.5">
                                <EnvironmentOutlined className="text-amber-500 mt-0.5" />
                                <span>{salon.address}</span>
                              </p>
                              <p className="mb-0 flex items-center gap-1.5">
                                <PhoneOutlined className="text-amber-500" />
                                <span>{salon.phoneNumber || "1800 6868"}</span>
                              </p>
                              <p className="mb-0 flex items-center gap-1.5">
                                <ClockCircleOutlined className="text-amber-500" />
                                <span>
                                  {Array.isArray(salon.openTime)
                                    ? `${String(salon.openTime[0]).padStart(2, "0")}:${String(salon.openTime[1]).padStart(2, "0")}`
                                    : salon.openTime} –{" "}
                                  {Array.isArray(salon.closeTime)
                                    ? `${String(salon.closeTime[0]).padStart(2, "0")}:${String(salon.closeTime[1]).padStart(2, "0")}`
                                    : salon.closeTime}
                                </span>
                              </p>
                            </div>

                            <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                              <span>Thợ phụ trách: <strong>{salonStylists.length} Stylists</strong></span>
                              <span>Lịch hẹn: <strong>{salonBookings.length}</strong></span>
                              <Tag color={salon.enabled ? "success" : "error"} className="text-xs m-0">
                                {salon.enabled ? "Đang mở cửa" : "Tạm đóng"}
                              </Tag>
                            </div>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════ */}
              {/* VIEW 6: DEEP STATS & REPORTS WITH CHARTS                */}
              {/* ═══════════════════════════════════════════════════════ */}
              {activeSection === "stats" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-gray-800 mb-0">Báo cáo phân tích chuyên sâu</h2>
                      <p className="text-xs text-gray-400 mb-0">Dữ liệu tài chính, chất lượng dịch vụ & KPIs</p>
                    </div>
                    <Segmented
                      options={[
                        { label: "7 ngày qua", value: "7_DAYS" },
                        { label: "30 ngày qua", value: "30_DAYS" },
                        { label: "Quý này", value: "QUARTER" },
                        { label: "Năm 2026", value: "YEAR" },
                      ]}
                      value={statsRange}
                      onChange={setStatsRange}
                    />
                  </div>

                  {/* Operational Quality Gauges */}
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                      <Card className="rounded-2xl border-gray-100 shadow-sm text-center p-4">
                        <Progress type="circle" percent={96} strokeColor="#52c41a" size={110} />
                        <h4 className="font-bold text-sm text-gray-800 mt-3 mb-1">Tỉ lệ đúng giờ</h4>
                        <p className="text-xs text-gray-400 mb-0">Khách hàng được phục vụ đúng khung giờ hẹn</p>
                      </Card>
                    </Col>

                    <Col xs={24} md={8}>
                      <Card className="rounded-2xl border-gray-100 shadow-sm text-center p-4">
                        <Progress type="circle" percent={88} strokeColor="#1890ff" size={110} />
                        <h4 className="font-bold text-sm text-gray-800 mt-3 mb-1">Tỉ lệ khách hàng quay lại</h4>
                        <p className="text-xs text-gray-400 mb-0">Hội viên đặt lịch lại trong vòng 30 ngày</p>
                      </Card>
                    </Col>

                    <Col xs={24} md={8}>
                      <Card className="rounded-2xl border-gray-100 shadow-sm text-center p-4">
                        <Progress type="circle" percent={98} strokeColor="#faad14" size={110} />
                        <h4 className="font-bold text-sm text-gray-800 mt-3 mb-1">Mức độ hài lòng (CSAT)</h4>
                        <p className="text-xs text-gray-400 mb-0">Đánh giá 4 sao trở lên từ khách hàng</p>
                      </Card>
                    </Col>
                  </Row>

                  {/* Top Services Chart & Top Stylists Ranking */}
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                      <Card
                        title={
                          <span className="font-bold text-sm text-gray-800 flex items-center gap-2">
                            <FireOutlined className="text-amber-500" />
                            Top Dịch vụ được lựa chọn nhiều nhất
                          </span>
                        }
                        className="rounded-2xl border-gray-100 shadow-sm"
                      >
                        <div className="space-y-4 py-2">
                          {topServicesData.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-4">Chưa có dữ liệu đặt lịch</p>
                          ) : (
                            topServicesData.map((item, idx) => (
                              <div key={idx}>
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="font-bold text-gray-800">{idx + 1}. {item.name}</span>
                                  <span className="text-gray-500">{item.count} lượt ({formatCurrency(item.rev)})</span>
                                </div>
                                <Progress percent={item.percent} strokeColor={item.color} size="small" />
                              </div>
                            ))
                          )}
                        </div>
                      </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                      <Card
                        title={
                          <span className="font-bold text-sm text-gray-800 flex items-center gap-2">
                            <StarOutlined className="text-amber-500" />
                            Bảng xếp hạng Hiệu suất Stylist
                          </span>
                        }
                        className="rounded-2xl border-gray-100 shadow-sm"
                      >
                        <div className="space-y-3 py-1">
                          {stylists.slice(0, 5).map((st, idx) => (
                            <div key={st.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                                  idx === 0 ? "bg-amber-400 text-black shadow-sm" : idx === 1 ? "bg-slate-300 text-gray-800" : "bg-gray-200 text-gray-600"
                                }`}>
                                  {idx + 1}
                                </span>
                                <Avatar size={36} src={st.avatarUrl} />
                                <div>
                                  <p className="font-bold text-xs text-gray-800 mb-0">{st.fullName}</p>
                                  <span className="text-[11px] text-gray-400">{st.salonName}</span>
                                </div>
                              </div>

                              <div className="text-right">
                                <p className="font-bold text-xs text-amber-600 mb-0">{Number(st.ratingAverage || 4.9).toFixed(1)} ★</p>
                                <span className="text-[11px] text-gray-500">{st.totalServedBookings || 100} lượt cắt</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════ */}
              {/* VIEW 7: SETTINGS                                        */}
              {/* ═══════════════════════════════════════════════════════ */}
              {activeSection === "settings" && (
                <div className="max-w-3xl space-y-6">
                  <Card title="Cấu hình Quy trình Vận hành Salon" className="rounded-2xl border-gray-100 shadow-sm">
                    <Form layout="vertical" initialValues={{ autoConfirm: true, minAdvance: 30, maxCancelHours: 2, hotline: "1800 6868" }}>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item label="Thời gian đặt trước tối thiểu (phút)" name="minAdvance">
                            <Input type="number" suffix="phút" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label="Thời gian hủy lịch miễn phí trước giờ hẹn" name="maxCancelHours">
                            <Input type="number" suffix="giờ" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item label="Hotline CSKH tổng đài" name="hotline">
                        <Input prefix={<PhoneOutlined />} />
                      </Form.Item>

                      <Divider />

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-sm text-gray-800 mb-0">Tự động duyệt lịch hẹn hợp lệ</p>
                            <span className="text-xs text-gray-400">Tự động chuyển từ Chờ xác nhận sang Đã xác nhận khi còn slot</span>
                          </div>
                          <Switch defaultChecked />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-sm text-gray-800 mb-0">Gửi thông báo SMS / Zalo nhắc lịch</p>
                            <span className="text-xs text-gray-400">Gửi tin nhắn nhắc khách trước giờ cắt tóc 60 phút</span>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>

                      <div className="mt-6">
                        <Button type="primary" className="bg-[#1b2a4a] hover:bg-[#244383] font-bold rounded-xl h-10 px-6">
                          Lưu cấu hình
                        </Button>
                      </div>
                    </Form>
                  </Card>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════ */}
              {/* VIEW: VOUCHERS MANAGEMENT                               */}
              {/* ═══════════════════════════════════════════════════════ */}
              {activeSection === "vouchers" && (
                <div className="space-y-6">
                  {/* Top Bar: Action & Stats */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div>
                      <h2 className="text-base font-extrabold text-gray-900 mb-1 flex items-center gap-2">
                        <GiftOutlined className="text-purple-600" />
                        Danh sách Voucher & Mã giảm giá
                      </h2>
                      <p className="text-xs text-gray-500 mb-0">
                        Quản lý các mã khuyến mãi, voucher tri ân và phân bổ cho khách hàng
                      </p>
                    </div>

                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setVoucherModalOpen(true)}
                      className="bg-purple-600 hover:bg-purple-700 font-bold rounded-xl h-10 px-5 flex items-center gap-2 shadow-sm"
                    >
                      Tạo Voucher mới
                    </Button>
                  </div>

                  {/* Summary KPI Cards */}
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                      <Card className="rounded-2xl border-gray-100 shadow-sm bg-gradient-to-br from-purple-50/70 to-white">
                        <Statistic
                          title={<span className="text-xs font-bold uppercase text-purple-700 tracking-wider">Tổng số Voucher</span>}
                          value={vouchers.length}
                          prefix={<GiftOutlined className="text-purple-500 mr-1" />}
                          valueStyle={{ fontWeight: 900, color: "#581c87" }}
                        />
                        <div className="mt-2 text-xs text-purple-600 font-medium">
                          {vouchers.filter(v => v.isActive).length} voucher đang có hiệu lực
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Card className="rounded-2xl border-gray-100 shadow-sm bg-gradient-to-br from-rose-50/70 to-white">
                        <Statistic
                          title={<span className="text-xs font-bold uppercase text-rose-700 tracking-wider">Tổng lượt đã sử dụng</span>}
                          value={vouchers.reduce((sum, v) => sum + (v.usedCount || 0), 0)}
                          prefix={<PercentageOutlined className="text-rose-500 mr-1" />}
                          valueStyle={{ fontWeight: 900, color: "#9f1239" }}
                        />
                        <div className="mt-2 text-xs text-rose-600 font-medium">
                          Áp dụng thành công cho khách hàng
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Card className="rounded-2xl border-gray-100 shadow-sm bg-gradient-to-br from-blue-50/70 to-white">
                        <Statistic
                          title={<span className="text-xs font-bold uppercase text-blue-700 tracking-wider">Voucher Công khai</span>}
                          value={vouchers.filter(v => v.isPublic).length}
                          prefix={<TagOutlined className="text-blue-500 mr-1" />}
                          valueStyle={{ fontWeight: 900, color: "#1e3a8a" }}
                        />
                        <div className="mt-2 text-xs text-blue-600 font-medium">
                          Khách hàng có thể tự chọn tại trang thanh toán
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  {/* Vouchers Table */}
                  <Card className="rounded-2xl border-gray-100 shadow-sm">
                    <Table
                      dataSource={vouchers}
                      columns={VOUCHER_COLUMNS}
                      rowKey="id"
                      pagination={{ pageSize: 8 }}
                      className="ant-table-modern"
                    />
                  </Card>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════ */}
              {/* VIEW: PRODUCT MANAGEMENT */}
              {/* ═══════════════════════════════════════════════════════ */}
              {activeSection === 'products' && (
                <div className="space-y-6">
                  {/* Stats Row */}
                  {productStats && (
                    <Row gutter={[16, 16]}>
                      {[
                        { label: 'Tổng sản phẩm', value: productStats.total, color: 'text-blue-700', icon: '📦' },
                        { label: 'Đang bán', value: productStats.active, color: 'text-green-700', icon: '✅' },
                        { label: 'Hết hàng', value: productStats.outOfStock, color: 'text-red-700', icon: '⚠️' },
                        { label: 'Tổng doanh thu (ước tính)', value: formatCurrency(productStats.totalRevenue), color: 'text-purple-700', icon: '💰' },
                      ].map(({ label, value, color, icon }) => (
                        <Col xs={12} sm={6} key={label}>
                          <Card className="rounded-xl border-gray-100 shadow-sm">
                            <div className="text-2xl mb-1">{icon}</div>
                            <div className={`text-xl font-black ${color}`}>{value}</div>
                            <div className="text-xs text-gray-500">{label}</div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                  
                  {/* Top Sellers */}
                  {productStats?.topSellers?.length > 0 && (
                    <Card className="rounded-xl border-gray-100 shadow-sm" title={<span className="font-bold">🏆 Top 5 Bán chạy nhất</span>}>
                      <div className="space-y-3">
                        {productStats.topSellers.map((p, idx) => (
                          <div key={p.id} className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                            <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-800 truncate">{p.name}</p>
                              <p className="text-xs text-gray-400">Đã bán: {p.soldCount} | Doanh thu: {formatCurrency(p.revenue)}đ</p>
                            </div>
                            <Rate disabled value={p.rating} allowHalf className="text-xs" />
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                  
                  {/* Product Table */}
                  <Card
                    className="rounded-xl border-gray-100 shadow-sm"
                    title={<span className="font-bold">📦 Danh sách sản phẩm ({products.length})</span>}
                    extra={
                      <div className="flex gap-2">
                        <Input.Search
                          placeholder="Tìm sản phẩm..."
                          value={productSearch}
                          onChange={e => setProductSearch(e.target.value)}
                          allowClear
                          className="w-48"
                        />
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenProductModal()} className="bg-[#60a5fa]">
                          Thêm sản phẩm
                        </Button>
                      </div>
                    }
                  >
                    <Table
                      dataSource={products.filter(p => !productSearch || p.name?.toLowerCase().includes(productSearch.toLowerCase()))}
                      rowKey="id"
                      size="middle"
                      scroll={{ x: 800 }}
                      pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `${t} sản phẩm` }}
                      columns={[
                        {
                          title: 'Sản phẩm',
                          key: 'product',
                          width: 280,
                          render: (_, r) => (
                            <div className="flex items-center gap-3">
                              <img src={r.imageUrl} alt={r.name} className="w-12 h-12 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-sm text-gray-800 line-clamp-1">{r.name}</p>
                                <p className="text-xs text-gray-400">{r.categoryName}</p>
                              </div>
                            </div>
                          ),
                        },
                        {
                          title: 'Giá bán',
                          dataIndex: 'price',
                          key: 'price',
                          render: v => <span className="font-bold text-red-600">{formatCurrency(v)}đ</span>,
                        },
                        {
                          title: 'Tồn kho',
                          dataIndex: 'stockQuantity',
                          key: 'stock',
                          render: v => <span className={`font-bold ${v <= 0 ? 'text-red-600' : v < 10 ? 'text-orange-600' : 'text-green-600'}`}>{v}</span>,
                        },
                        {
                          title: 'Đã bán',
                          dataIndex: 'soldCount',
                          key: 'sold',
                          render: v => <span className="font-semibold text-blue-600">{v || 0}</span>,
                        },
                        {
                          title: 'Đánh giá',
                          key: 'rating',
                          render: (_, r) => (
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-500 font-bold">{Number(r.rating || 5).toFixed(1)}</span>
                              <span className="text-gray-400 text-xs">★ ({r.reviewCount || 0})</span>
                            </div>
                          ),
                        },
                        {
                          title: 'Trạng thái',
                          dataIndex: 'active',
                          key: 'active',
                          render: v => <Tag color={v ? 'success' : 'default'}>{v ? 'Đang bán' : 'Tạm ẩn'}</Tag>,
                        },
                        {
                          title: 'Hành động',
                          key: 'actions',
                          fixed: 'right',
                          width: 120,
                          render: (_, r) => (
                            <div className="flex gap-1">
                              <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenProductModal(r)} className="text-blue-600 border-blue-200" />
                              <Popconfirm title="Xóa sản phẩm này?" onConfirm={() => handleDeleteProduct(r.id)} okText="Xóa" cancelText="Hủy" okType="danger">
                                <Button size="small" icon={<DeleteOutlined />} danger />
                              </Popconfirm>
                            </div>
                          ),
                        },
                      ]}
                    />
                  </Card>
                  
                  {/* Product Modal */}
                  <Modal
                    title={<span className="font-bold">{editingProduct ? '✏️ Chỉnh sửa sản phẩm' : '➕ Thêm sản phẩm mới'}</span>}
                    open={productModalOpen}
                    onCancel={() => { setProductModalOpen(false); productForm.resetFields(); }}
                    footer={null}
                    width={600}
                  >
                    <Form form={productForm} layout="vertical" onFinish={handleSaveProduct} className="mt-4">
                      <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}>
                        <Input placeholder="Nhập tên sản phẩm" />
                      </Form.Item>
                      <Form.Item name="description" label="Mô tả">
                        <Input.TextArea rows={3} placeholder="Mô tả sản phẩm" />
                      </Form.Item>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item name="price" label="Giá bán (VNĐ)" rules={[{ required: true }]}>
                            <InputNumber min={0} className="w-full" formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="originalPrice" label="Giá gốc (VNĐ)">
                            <InputNumber min={0} className="w-full" formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item name="stockQuantity" label="Tồn kho" rules={[{ required: true }]}>
                            <InputNumber min={0} className="w-full" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true }]}>
                            <Select placeholder="Chọn danh mục">
                              {productCategories.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                      <Form.Item name="imageUrl" label="URL ảnh sản phẩm">
                        <Input placeholder="https://..." />
                      </Form.Item>
                      <Form.Item name="active" label="Trạng thái" valuePropName="checked">
                        <Switch checkedChildren="Đang bán" unCheckedChildren="Tạm ẩn" />
                      </Form.Item>
                      <div className="flex justify-end gap-3 mt-4">
                        <Button onClick={() => { setProductModalOpen(false); productForm.resetFields(); }}>Hủy</Button>
                        <Button type="primary" htmlType="submit" loading={savingProduct} className="bg-[#60a5fa]">Lưu sản phẩm</Button>
                      </div>
                    </Form>
                  </Modal>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════ */}
              {/* VIEW: ORDER MANAGEMENT */}
              {/* ═══════════════════════════════════════════════════════ */}
              {activeSection === 'orders' && (
                <div className="space-y-6">
                  <Card
                    className="rounded-xl border-gray-100 shadow-sm"
                    title={<span className="font-bold">🛒 Quản lý đơn hàng ({orders.length})</span>}
                    extra={
                      <Select value={orderStatusFilter} onChange={setOrderStatusFilter} className="w-44">
                        <Option value="ALL">Tất cả trạng thái</Option>
                        <Option value="PENDING">Chờ xử lý</Option>
                        <Option value="CONFIRMED">Đã xác nhận</Option>
                        <Option value="PROCESSING">Đang xử lý</Option>
                        <Option value="SHIPPING">Đang giao</Option>
                        <Option value="DELIVERED">Đã giao thành công</Option>
                        <Option value="CANCELLED">Đã hủy</Option>
                      </Select>
                    }
                  >
                    <Table
                      dataSource={orders.filter(o => {
                        if (orderStatusFilter === 'ALL') return true;
                        const s = o.status === 'SHIPPED' ? 'SHIPPING' : o.status;
                        return s === orderStatusFilter;
                      })}
                      rowKey={r => r.id || r.orderId || r.orderCode}
                      size="middle"
                      scroll={{ x: 950 }}
                      pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `${t} đơn hàng` }}
                      columns={[
                        {
                          title: 'Mã đơn hàng',
                          dataIndex: 'orderCode',
                          key: 'orderCode',
                          render: v => <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{v}</span>,
                        },
                        {
                          title: 'Khách hàng',
                          key: 'customer',
                          render: (_, r) => (
                            <div>
                              <p className="font-semibold text-sm mb-0">{r.receiverName || r.userName}</p>
                              <p className="text-xs text-gray-400 mb-0">{r.receiverPhone}</p>
                            </div>
                          ),
                        },
                        {
                          title: 'Tổng tiền',
                          dataIndex: 'finalAmount',
                          key: 'amount',
                          render: v => <span className="font-bold text-red-600">{formatCurrency(v)}đ</span>,
                        },
                        {
                          title: 'Thanh toán',
                          dataIndex: 'paymentMethod',
                          key: 'payment',
                          render: v => <Tag color={v === 'BANK_TRANSFER' ? 'blue' : 'green'}>{v === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt'}</Tag>,
                        },
                        {
                          title: 'Trạng thái',
                          dataIndex: 'status',
                          key: 'status',
                          render: v => {
                            const norm = v === 'SHIPPED' ? 'SHIPPING' : v;
                            const cfg = {
                              PENDING: ['warning', 'Chờ xử lý'],
                              CONFIRMED: ['processing', 'Đã xác nhận'],
                              PROCESSING: ['cyan', 'Đang xử lý'],
                              SHIPPING: ['blue', 'Đang giao'],
                              DELIVERED: ['success', 'Đã giao'],
                              CANCELLED: ['error', 'Đã hủy']
                            };
                            const [color, label] = cfg[norm] || ['default', v];
                            return <Tag color={color}>{label}</Tag>;
                          },
                        },
                        {
                          title: 'Ngày đặt',
                          dataIndex: 'createdAt',
                          key: 'date',
                          render: v => v ? new Date(v).toLocaleDateString('vi-VN') : '—',
                        },
                        {
                          title: 'Hành động',
                          key: 'actions',
                          render: (_, r) => (
                            <div className="flex items-center gap-1.5">
                              <Button
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => { setSelectedOrder(r); setOrderModalOpen(true); }}
                                className="text-xs text-blue-600 border-blue-200"
                              >
                                Chi tiết
                              </Button>
                              <Select
                                value={r.status === 'SHIPPED' ? 'SHIPPING' : r.status}
                                size="small"
                                className="w-32"
                                onChange={(val) => handleUpdateOrderStatus(r.id || r.orderId, val)}
                              >
                                <Option value="PENDING">Chờ xử lý</Option>
                                <Option value="CONFIRMED">Đã duyệt</Option>
                                <Option value="PROCESSING">Đang xử lý</Option>
                                <Option value="SHIPPING">Đang giao</Option>
                                <Option value="DELIVERED">Đã giao</Option>
                                <Option value="CANCELLED">Đã hủy</Option>
                              </Select>
                            </div>
                          ),
                        },
                      ]}
                    />
                  </Card>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════ */}
              {/* VIEW: REVIEWS MANAGEMENT & STATISTICS */}
              {/* ═══════════════════════════════════════════════════════ */}
              {activeSection === 'reviews' && (
                <div className="space-y-6">
                  {/* Reviews Stats */}
                  <Row gutter={[16, 16]}>
                    <Col xs={12} sm={6}>
                      <Card className="rounded-xl border-gray-100 shadow-sm">
                        <div className="text-2xl mb-1">⭐</div>
                        <div className="text-xl font-black text-amber-500">
                          {reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.rating || 5), 0) / reviews.length).toFixed(1) : '5.0'} / 5.0
                        </div>
                        <div className="text-xs text-gray-500">Điểm đánh giá trung bình</div>
                      </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Card className="rounded-xl border-gray-100 shadow-sm">
                        <div className="text-2xl mb-1">💬</div>
                        <div className="text-xl font-black text-blue-700">{reviews.length}</div>
                        <div className="text-xs text-gray-500">Tổng số lượt đánh giá</div>
                      </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Card className="rounded-xl border-gray-100 shadow-sm">
                        <div className="text-2xl mb-1">🌟</div>
                        <div className="text-xl font-black text-emerald-600">
                          {reviews.filter(r => r.rating === 5).length}
                        </div>
                        <div className="text-xs text-gray-500">Đánh giá 5 sao tuyệt đối</div>
                      </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Card className="rounded-xl border-gray-100 shadow-sm">
                        <div className="text-2xl mb-1">👍</div>
                        <div className="text-xl font-black text-purple-700">
                          {reviews.length > 0 ? Math.round((reviews.filter(r => (r.rating || 5) >= 4).length / reviews.length) * 100) : 100}%
                        </div>
                        <div className="text-xs text-gray-500">Tỉ lệ phản hồi tích cực (4-5★)</div>
                      </Card>
                    </Col>
                  </Row>

                  {/* Reviews Table Card */}
                  <Card
                    className="rounded-xl border-gray-100 shadow-sm"
                    title={<span className="font-bold">⭐ Quản lý đánh giá sản phẩm ({reviews.length})</span>}
                    extra={
                      <div className="flex flex-wrap items-center gap-2">
                        <Input.Search
                          placeholder="Tìm sản phẩm, khách hàng, nội dung..."
                          value={reviewSearch}
                          onChange={(e) => setReviewSearch(e.target.value)}
                          allowClear
                          className="w-56"
                          size="small"
                        />
                        <Select
                          value={reviewFilterRating}
                          onChange={setReviewFilterRating}
                          className="w-36"
                          size="small"
                        >
                          <Option value="ALL">Tất cả số sao</Option>
                          <Option value="5">5 sao ⭐⭐⭐⭐⭐</Option>
                          <Option value="4">4 sao ⭐⭐⭐⭐</Option>
                          <Option value="3">3 sao ⭐⭐⭐</Option>
                          <Option value="2">2 sao ⭐⭐</Option>
                          <Option value="1">1 sao ⭐</Option>
                        </Select>
                      </div>
                    }
                  >
                    <Table
                      dataSource={reviews.filter((r) => {
                        const matchRating = reviewFilterRating === 'ALL' || String(r.rating) === String(reviewFilterRating);
                        const matchSearch =
                          !reviewSearch ||
                          r.productName?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
                          r.username?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
                          r.reviewContent?.toLowerCase().includes(reviewSearch.toLowerCase());
                        return matchRating && matchSearch;
                      })}
                      rowKey={(r) => r.id || Math.random()}
                      size="middle"
                      scroll={{ x: 800 }}
                      pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `${t} đánh giá` }}
                      columns={[
                        {
                          title: 'Sản phẩm',
                          key: 'product',
                          width: 250,
                          render: (_, r) => {
                            const prod = products.find(p => p.id === r.productId);
                            return (
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={prod?.imageUrl || "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=100&auto=format&fit=crop"}
                                  alt={r.productName || prod?.name}
                                  className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                                />
                                <div className="min-w-0">
                                  <p className="font-semibold text-xs text-gray-800 line-clamp-1 mb-0">
                                    {r.productName || prod?.name || 'Sản phẩm salon'}
                                  </p>
                                  <span className="text-[10px] text-gray-400 font-mono">
                                    ID: {String(r.productId || '').slice(0, 8)}...
                                  </span>
                                </div>
                              </div>
                            );
                          },
                        },
                        {
                          title: 'Khách hàng',
                          key: 'user',
                          width: 150,
                          render: (_, r) => (
                            <div>
                              <p className="font-semibold text-xs text-gray-800 mb-0">{r.username || 'Khách hàng'}</p>
                              <Tag color="cyan" className="text-[9px] px-1 py-0 leading-none">Đã mua hàng</Tag>
                            </div>
                          ),
                        },
                        {
                          title: 'Đánh giá',
                          dataIndex: 'rating',
                          key: 'rating',
                          width: 140,
                          render: (v) => <Rate disabled value={v || 5} allowHalf className="text-xs text-amber-500" />,
                        },
                        {
                          title: 'Nội dung phản hồi',
                          dataIndex: 'reviewContent',
                          key: 'content',
                          render: (v) => <p className="text-xs text-gray-700 leading-relaxed mb-0 line-clamp-2">{v || '—'}</p>,
                        },
                        {
                          title: 'Thời gian',
                          dataIndex: 'createdAt',
                          key: 'date',
                          width: 120,
                          render: (v) => <span className="text-xs text-gray-400">{v ? new Date(v).toLocaleDateString('vi-VN') : '—'}</span>,
                        },
                        {
                          title: 'Thao tác',
                          key: 'actions',
                          width: 90,
                          render: (_, r) => (
                            <Popconfirm
                              title="Xóa đánh giá này khỏi hệ thống?"
                              onConfirm={() => handleDeleteReview(r.id)}
                              okText="Xóa"
                              cancelText="Hủy"
                              okType="danger"
                            >
                              <Button size="small" icon={<DeleteOutlined />} danger className="text-xs">
                                Xóa
                              </Button>
                            </Popconfirm>
                          ),
                        },
                      ]}
                    />
                  </Card>
                </div>
              )}
            </>
          )}
        </Content>
      </Layout>

      {/* ── MODAL: BOOKING DETAIL ──────────────────────────────────── */}
      {selectedBooking && (
        <Modal
          open={!!selectedBooking}
          onCancel={() => setSelectedBooking(null)}
          footer={null}
          title={
            <div className="flex items-center gap-2">
              <CalendarOutlined className="text-blue-600" />
              <span>Chi tiết Lịch hẹn: {selectedBooking.bookingCode}</span>
            </div>
          }
          className="rounded-2xl"
          width={540}
        >
          <div className="py-2 space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-500">Khách hàng:</span>
                <strong className="text-gray-800">{selectedBooking.customerName || "—"}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Số điện thoại:</span>
                <strong className="text-gray-800">{selectedBooking.customerPhone || "—"}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Thời gian bắt đầu:</span>
                <strong>{formatDate(selectedBooking.startTime)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Thời gian kết thúc:</span>
                <strong>{formatDate(selectedBooking.endTime)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Stylist phục vụ:</span>
                <strong>{selectedBooking.stylistName || "—"}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Chi nhánh:</span>
                <strong>{selectedBooking.salonName || "—"}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phương thức thanh toán:</span>
                <Tag color="cyan">{selectedBooking.paymentMethod || "CASH"}</Tag>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="text-sm font-bold text-gray-800">Tổng tiền thanh toán:</span>
                <span className="text-base font-black text-amber-600">
                  {formatCurrency(selectedBooking.totalAmount)}
                </span>
              </div>
            </div>

            {selectedBooking.customerNotes && (
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-gray-700 italic">
                💬 Ghi chú khách: "{selectedBooking.customerNotes}"
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              {selectedBooking.status === "PENDING" && (
                <Button
                  type="primary"
                  className="bg-blue-600 font-bold rounded-xl"
                  onClick={() => handleUpdateBooking(selectedBooking.id, "CONFIRMED")}
                >
                  Xác nhận lịch hẹn
                </Button>
              )}
              {selectedBooking.status === "CONFIRMED" && (
                <Button
                  type="primary"
                  className="bg-green-600 font-bold rounded-xl"
                  onClick={() => handleUpdateBooking(selectedBooking.id, "COMPLETED")}
                >
                  Đánh dấu hoàn thành
                </Button>
              )}
              {selectedBooking.status !== "CANCELLED" && selectedBooking.status !== "COMPLETED" && (
                <Button
                  danger
                  onClick={() => handleUpdateBooking(selectedBooking.id, "CANCELLED")}
                  className="rounded-xl"
                >
                  Hủy lịch
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL: STYLIST SERVICES LIST ───────────────────────────── */}
      {selectedStylistServices && (
        <Modal
          open={!!selectedStylistServices}
          onCancel={() => setSelectedStylistServices(null)}
          footer={null}
          title={
            <div className="flex items-center gap-2">
              <ScissorOutlined className="text-blue-600" />
              <span>Dịch vụ phụ trách: {selectedStylistName}</span>
            </div>
          }
          className="rounded-2xl"
          width={520}
        >
          <div className="py-2">
            {stylistServicesLoading ? (
              <div className="py-10 text-center"><Spin /></div>
            ) : selectedStylistServices.length === 0 ? (
              <p className="text-gray-400 text-center py-6">Stylist này đảm nhiệm tất cả dịch vụ cơ bản.</p>
            ) : (
              <div className="space-y-2.5">
                {selectedStylistServices.map((srv, idx) => (
                  <div key={srv.id || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <p className="font-bold text-xs text-gray-800 mb-0">{srv.serviceName}</p>
                      <span className="text-[11px] text-gray-400">⏱️ Thời lượng: {srv.duration || 45} phút</span>
                    </div>
                    <span className="font-bold text-sm text-amber-700">{formatCurrency(srv.price)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ── MODAL: CREATE VOUCHER ──────────────────────────────────── */}
      <Modal
        open={voucherModalOpen}
        onCancel={() => {
          setVoucherModalOpen(false);
          voucherForm.resetFields();
        }}
        footer={null}
        title={
          <div className="flex items-center gap-2">
            <GiftOutlined className="text-purple-600" />
            <span className="font-extrabold text-base">Tạo mới Voucher khuyến mãi</span>
          </div>
        }
        className="rounded-2xl"
        width={560}
      >
        <Form
          form={voucherForm}
          layout="vertical"
          onFinish={handleCreateVoucherSubmit}
          initialValues={{
            discountType: "PERCENT",
            isPublic: true,
            usageLimitTotal: 1000,
            minOrderAmount: 0,
          }}
          className="pt-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              name="voucherCode"
              label={<span className="text-xs font-bold text-gray-700">Mã Voucher (Code)</span>}
              rules={[{ required: true, message: "Vui lòng nhập mã voucher" }]}
            >
              <Input
                placeholder="SALON20, VIP50K..."
                className="uppercase font-mono font-bold rounded-xl"
              />
            </Form.Item>

            <Form.Item
              name="voucherName"
              label={<span className="text-xs font-bold text-gray-700">Tên chương trình ưu đãi</span>}
              rules={[{ required: true, message: "Vui lòng nhập tên chương trình" }]}
            >
              <Input placeholder="Giảm giá tri ân, Bạn mới..." className="rounded-xl" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              name="discountType"
              label={<span className="text-xs font-bold text-gray-700">Hình thức giảm giá</span>}
              rules={[{ required: true }]}
            >
              <Select className="rounded-xl">
                <Option value="PERCENT">Giảm theo tỷ lệ %</Option>
                <Option value="FIXED_AMOUNT">Giảm số tiền cố định (VNĐ)</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="discountValue"
              label={<span className="text-xs font-bold text-gray-700">Mức giảm (% hoặc VNĐ)</span>}
              rules={[{ required: true, message: "Vui lòng nhập mức giảm" }]}
            >
              <InputNumber
                className="w-full rounded-xl"
                min={1}
                placeholder="20 hoặc 50000"
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              name="maxDiscountAmount"
              label={<span className="text-xs font-bold text-gray-700">Giảm tối đa (VNĐ - dành cho %)</span>}
            >
              <InputNumber
                className="w-full rounded-xl"
                min={0}
                placeholder="Ví dụ: 100000"
              />
            </Form.Item>

            <Form.Item
              name="minOrderAmount"
              label={<span className="text-xs font-bold text-gray-700">Đơn tối thiểu áp dụng (VNĐ)</span>}
            >
              <InputNumber
                className="w-full rounded-xl"
                min={0}
                placeholder="Ví dụ: 150000"
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              name="usageLimitTotal"
              label={<span className="text-xs font-bold text-gray-700">Giới hạn tổng lượt dùng</span>}
            >
              <InputNumber
                className="w-full rounded-xl"
                min={1}
                placeholder="1000"
              />
            </Form.Item>

            <Form.Item
              name="isPublic"
              label={<span className="text-xs font-bold text-gray-700">Công khai cho tất cả người dùng</span>}
              valuePropName="checked"
            >
              <Switch defaultChecked />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label={<span className="text-xs font-bold text-gray-700">Mô tả ưu đãi & Điều kiện</span>}
          >
            <Input.TextArea
              rows={3}
              placeholder="Nhập mô tả chi tiết quyền lợi và quy định áp dụng..."
              className="rounded-xl"
            />
          </Form.Item>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              onClick={() => {
                setVoucherModalOpen(false);
                voucherForm.resetFields();
              }}
              className="rounded-xl"
            >
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={creatingVoucher}
              className="bg-purple-600 hover:bg-purple-700 font-bold rounded-xl"
            >
              Xác nhận tạo Voucher
            </Button>
          </div>
        </Form>
      </Modal>

      {/* ── MODAL: ORDER DETAIL ────────────────────────────────────── */}
      {selectedOrder && (
        <Modal
          open={orderModalOpen}
          onCancel={() => { setOrderModalOpen(false); setSelectedOrder(null); }}
          footer={null}
          title={
            <div className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-2">
                <DollarOutlined className="text-blue-600 text-lg" />
                <span className="font-bold text-base">Chi tiết Đơn hàng #{selectedOrder.orderCode}</span>
              </div>
              <Tag
                color={
                  selectedOrder.status === 'DELIVERED' ? 'success' :
                  selectedOrder.status === 'SHIPPING' || selectedOrder.status === 'SHIPPED' ? 'blue' :
                  selectedOrder.status === 'PROCESSING' ? 'cyan' :
                  selectedOrder.status === 'CONFIRMED' ? 'processing' :
                  selectedOrder.status === 'CANCELLED' ? 'error' : 'warning'
                }
                className="font-bold text-xs"
              >
                {selectedOrder.status}
              </Tag>
            </div>
          }
          width={720}
          className="rounded-2xl"
        >
          <div className="py-2 space-y-4 text-xs">
            {/* Customer & Shipping Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-gray-100">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Thông tin người nhận</p>
                <p className="font-bold text-sm text-gray-800 mb-0.5">{selectedOrder.receiverName || selectedOrder.userName}</p>
                <p className="text-gray-600 mb-0.5">📞 {selectedOrder.receiverPhone}</p>
                <p className="text-gray-600 mb-0">📍 {selectedOrder.shippingAddress || 'Nhận tại Salon'}</p>
                {selectedOrder.note && (
                  <p className="text-gray-500 italic mt-1 mb-0">Ghi chú: "{selectedOrder.note}"</p>
                )}
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Phương thức thanh toán</p>
                <p className="font-bold text-sm text-gray-800 mb-0.5">
                  {selectedOrder.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản VietQR' : 'Tiền mặt khi giao hàng (COD)'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-500">Trạng thái thanh toán:</span>
                  <Tag color={selectedOrder.paymentStatus === 'SUCCESS' ? 'success' : 'warning'}>
                    {selectedOrder.paymentStatus === 'SUCCESS' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </Tag>
                </div>
                <p className="text-gray-400 mt-2 mb-0">
                  Ngày đặt: {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString('vi-VN') : '—'}
                </p>
              </div>
            </div>

            {/* Ordered Items Table */}
            <div>
              <p className="font-bold text-sm text-gray-800 mb-2">📦 Danh sách sản phẩm đặt mua</p>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <Table
                  dataSource={selectedOrder.items || []}
                  rowKey={(i) => i.orderDetailId || i.productId || Math.random()}
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: 'Sản phẩm',
                      key: 'item',
                      render: (_, item) => (
                        <div className="flex items-center gap-2.5">
                          <img
                            src={item.productImage || "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=100&auto=format&fit=crop"}
                            alt={item.productName}
                            className="w-9 h-9 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                          />
                          <span className="font-semibold text-xs text-gray-800 line-clamp-1">{item.productName}</span>
                        </div>
                      ),
                    },
                    {
                      title: 'Đơn giá',
                      dataIndex: 'unitPrice',
                      key: 'unitPrice',
                      render: (v) => <span>{formatCurrency(v)}đ</span>,
                    },
                    {
                      title: 'Số lượng',
                      dataIndex: 'quantity',
                      key: 'qty',
                      align: 'center',
                      render: (v) => <Tag color="blue" className="font-bold">{v}</Tag>,
                    },
                    {
                      title: 'Thành tiền',
                      dataIndex: 'totalPrice',
                      key: 'lineTotal',
                      align: 'right',
                      render: (v, r) => (
                        <span className="font-bold text-red-600">
                          {formatCurrency(v || (Number(r.unitPrice) * Number(r.quantity)))}đ
                        </span>
                      ),
                    },
                  ]}
                  locale={{ emptyText: 'Không có thông tin chi tiết món hàng' }}
                />
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1.5">
              <div className="flex justify-between text-gray-600">
                <span>Tiền hàng:</span>
                <span>{formatCurrency(selectedOrder.totalAmount || selectedOrder.finalAmount)}đ</span>
              </div>
              {selectedOrder.shippingFee > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển:</span>
                  <span>+{formatCurrency(selectedOrder.shippingFee)}đ</span>
                </div>
              )}
              {selectedOrder.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Giảm giá:</span>
                  <span>-{formatCurrency(selectedOrder.discountAmount)}đ</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-red-600 pt-1.5 border-t border-gray-200">
                <span>Tổng cộng thanh toán:</span>
                <span>{formatCurrency(selectedOrder.finalAmount)}đ</span>
              </div>
            </div>

            {/* Status Update Control */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="font-bold text-gray-700">Cập nhật trạng thái đơn:</span>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedOrder.status === 'SHIPPED' ? 'SHIPPING' : selectedOrder.status}
                  onChange={(val) => handleUpdateOrderStatus(selectedOrder.id || selectedOrder.orderId, val)}
                  className="w-44"
                >
                  <Option value="PENDING">Chờ xử lý</Option>
                  <Option value="CONFIRMED">Đã duyệt (Confirmed)</Option>
                  <Option value="PROCESSING">Đang chuẩn bị (Processing)</Option>
                  <Option value="SHIPPING">Đang giao hàng (Shipping)</Option>
                  <Option value="DELIVERED">Đã giao thành công (Delivered)</Option>
                  <Option value="CANCELLED">Hủy đơn hàng (Cancelled)</Option>
                </Select>
                <Button type="primary" onClick={() => { setOrderModalOpen(false); setSelectedOrder(null); }} className="bg-blue-600">
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
