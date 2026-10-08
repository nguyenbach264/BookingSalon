import React, { useEffect, useState, useMemo } from "react";
import {
  Layout,
  Menu,
  Avatar,
  Tag,
  Badge,
  Spin,
  Button,
  Modal,
  Form,
  Drawer,
  Popconfirm,
  Progress,
  message,
} from "antd";
import {
  UserOutlined,
  CalendarOutlined,
  DashboardOutlined,
  BankOutlined,
  ShopOutlined,
  EyeOutlined,
  GiftOutlined,
  DeleteOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  ScissorOutlined,
  CheckSquareOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../auth/authProvider";
import { useNavigate } from "react-router-dom";
import { getGlobalStatistics, getAllBookings } from "../../service/api/bookingApi";
import { getUsers, getStylists, updateBookingStatus, getStylistServices } from "../../service/api/adminApi";
import { getSalons } from "../../service/api/salonApi";
import { getServiceOfferings } from "../../service/api/serviceApi";
import { getAdminVouchers, createVoucher, deleteVoucher } from "../../service/api/voucherApi";
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  getAdminProductStats,
  getAdminOrders,
  updateAdminOrderStatus,
  getAdminReviews,
  deleteAdminReview,
} from "../../service/api/adminApi";
import { getProductCategories } from "../../service/api/productApi";
import notificationWs from "../../service/websocket/notificationWebSocket";

import AdminStylistManager from "./AdminStylistManager";
import AdminServiceManager from "./AdminServiceManager";
import AdminOverview from "./views/AdminOverview";
import AdminBookingsView from "./views/AdminBookingsView";
import AdminUsersView from "./views/AdminUsersView";
import AdminSalonsView from "./views/AdminSalonsView";
import AdminStatsView from "./views/AdminStatsView";
import AdminSettingsView from "./views/AdminSettingsView";
import AdminVouchersView from "./views/AdminVouchersView";
import AdminProductsView from "./views/AdminProductsView";
import AdminOrdersView from "./views/AdminOrdersView";
import AdminReviewsView from "./views/AdminReviewsView";

const { Header, Sider, Content } = Layout;

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
  const [mobileOpen, setMobileOpen] = useState(false);
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
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewFilterRating, setReviewFilterRating] = useState("ALL");
  const [productSearch, setProductSearch] = useState("");
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
    if (activeSection === "products" || activeSection === "orders" || activeSection === "reviews") {
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
      if (prodsData.status === "fulfilled") setProducts(prodsData.value?.content || prodsData.value || []);
      if (orderData.status === "fulfilled") setOrders(orderData.value || []);
      if (catData.status === "fulfilled") setProductCategories(catData.value || []);
      if (statsData.status === "fulfilled") setProductStats(statsData.value);
      if (revsData.status === "fulfilled") setReviews(revsData.value?.content || revsData.value || []);
    } catch (err) {
      console.error("Error loading products/orders/reviews:", err);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await deleteAdminReview(reviewId);
      message.success("Đã xóa đánh giá thành công!");
      loadProductsAndOrders();
    } catch {
      message.error("Xóa đánh giá thất bại!");
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
        message.success("Đã cập nhật sản phẩm thành công!");
      } else {
        await createAdminProduct(payload);
        message.success("Đã tạo sản phẩm mới thành công!");
      }
      setProductModalOpen(false);
      productForm.resetFields();
      loadProductsAndOrders();
    } catch (err) {
      message.error(err?.response?.data?.message || "Lưu sản phẩm thất bại!");
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await deleteAdminProduct(productId);
      message.success("Đã xóa sản phẩm!");
      loadProductsAndOrders();
    } catch {
      message.error("Xóa sản phẩm thất bại!");
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await updateAdminOrderStatus(orderId, status);
      message.success("Đã cập nhật trạng thái đơn hàng!");
      loadProductsAndOrders();
    } catch {
      message.error("Cập nhật thất bại!");
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
        endDate: values.dateRange?.[1] ? values.dateRange[1].toISOString() : new Date(Date.now() + 365 * 86400000).toISOString(),
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
  const totalBookingsCount = useMemo(
    () => stats?.total ?? stats?.totalCount ?? bookings.length,
    [stats, bookings]
  );

  const completionRate = totalBookingsCount > 0 ? Math.round((completedCount / totalBookingsCount) * 100) : 0;

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
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
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

    const periodBookings = bookings.filter((b) => {
      const d = parseAnyDate(b.startTime || b.bookingDate);
      return d && d >= startDate && d <= now;
    });

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
    { key: "services", icon: <CheckSquareOutlined />, label: "Quản lý Dịch vụ" },
    { key: "salons", icon: <ShopOutlined />, label: `Salon (${salons.length})` },
    { key: "vouchers", icon: <GiftOutlined />, label: `Quản lý Voucher (${vouchers.length})` },
    { key: "stats", icon: <BarChartOutlined />, label: "Phân tích & Báo cáo" },
    { key: "products", icon: <ShopOutlined />, label: "Quản lý sản phẩm" },
    { key: "orders", icon: <BankOutlined />, label: "Quản lý đơn hàng" },
    { key: "reviews", icon: <ShopOutlined />, label: `Đánh giá Shop (${reviews.length})` },
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
      render: (v) => (
        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
          {v || "—"}
        </span>
      ),
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
        <div className="flex items-center gap-1.5 flex-wrap">
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
      render: (v) => (v ? <Tag color="purple" className="font-mono text-xs">{v}</Tag> : <span className="text-gray-400 text-xs">—</span>),
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

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex flex-col items-center py-6 px-4 border-b border-gray-100 bg-white">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-500 rounded-2xl flex items-center justify-center mb-2.5 shadow-md">
          <BankOutlined className="text-white text-2xl" />
        </div>
        <span className="text-gray-900 font-black text-sm tracking-widest uppercase">
          ADMIN PORTAL
        </span>
        <span className="text-gray-400 text-xs font-semibold">BachBarber Hair Salon</span>
      </div>

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

      <Menu
        mode="inline"
        selectedKeys={[activeSection]}
        items={menuItems}
        onClick={({ key }) => {
          if (key === "logout") {
            handleLogout();
          } else {
            setActiveSection(key);
            setMobileOpen(false);
          }
        }}
        className="border-none pt-2 flex-1"
      />
    </div>
  );

  return (
    <Layout className="min-h-screen bg-gray-50">
      {/* Desktop Sider */}
      <Sider
        width={250}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        className="shadow-md border-r border-gray-100 hidden lg:block"
      >
        {sidebarContent}
      </Sider>

      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        bodyStyle={{ padding: 0 }}
        width={260}
        className="lg:hidden"
      >
        {sidebarContent}
      </Drawer>

      {/* Main Content Area */}
      <Layout>
        {/* Header */}
        <Header className="bg-white px-4 sm:px-6 md:px-8 flex items-center justify-between shadow-sm border-b border-gray-100 h-16 sticky top-0 z-30">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              type="text"
              icon={<MenuOutlined />}
              className="lg:hidden text-lg"
              onClick={() => setMobileOpen(true)}
            />
            <h1 className="text-sm sm:text-base md:text-lg font-black text-gray-800 mb-0 truncate max-w-[200px] sm:max-w-none">
              {activeSection === "overview" && "Tổng quan hệ thống"}
              {activeSection === "bookings" && "Quản lý Lịch hẹn"}
              {activeSection === "users" && "Quản lý Khách hàng"}
              {activeSection === "stylists" && "Quản lý Stylist"}
              {activeSection === "services" && "Quản lý Dịch vụ"}
              {activeSection === "salons" && "Danh sách Chi nhánh"}
              {activeSection === "vouchers" && "Quản lý Voucher"}
              {activeSection === "stats" && "Báo cáo phân tích"}
              {activeSection === "products" && "Quản lý sản phẩm"}
              {activeSection === "orders" && "Quản lý đơn hàng"}
              {activeSection === "reviews" && "Đánh giá Shop"}
              {activeSection === "settings" && "Cài đặt hệ thống"}
            </h1>
            <Tag color="blue" className="text-xs hidden sm:inline-block">v2.5 Enterprise</Tag>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden sm:inline">Live Sync</span>
            </div>
            <div className="flex items-center gap-2 border-l border-gray-200 pl-3 sm:pl-4">
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
        <Content className="p-4 sm:p-6 md:p-8 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-32">
              <Spin size="large" tip="Đang tải dữ liệu hệ thống..." />
            </div>
          ) : (
            <>
              {activeSection === "overview" && (
                <AdminOverview
                  totalBookingsCount={totalBookingsCount}
                  pendingCount={pendingCount}
                  confirmedCount={confirmedCount}
                  completedCount={completedCount}
                  totalRevenue={totalRevenue}
                  formatCurrency={formatCurrency}
                  users={users}
                  salons={salons}
                  stylists={stylists}
                  adminTrendPeriod={adminTrendPeriod}
                  setAdminTrendPeriod={setAdminTrendPeriod}
                  adminTrendMetrics={adminTrendMetrics}
                  completionRate={completionRate}
                  bookings={bookings}
                  BOOKING_COLUMNS={BOOKING_COLUMNS}
                  setActiveSection={setActiveSection}
                />
              )}

              {activeSection === "bookings" && (
                <AdminBookingsView
                  bookingSearch={bookingSearch}
                  setBookingSearch={setBookingSearch}
                  bookingStatusFilter={bookingStatusFilter}
                  setBookingStatusFilter={setBookingStatusFilter}
                  bookingSalonFilter={bookingSalonFilter}
                  setBookingSalonFilter={setBookingSalonFilter}
                  salons={salons}
                  pendingCount={pendingCount}
                  confirmedCount={confirmedCount}
                  completedCount={completedCount}
                  filteredBookings={filteredBookings}
                  BOOKING_COLUMNS={BOOKING_COLUMNS}
                />
              )}

              {activeSection === "users" && (
                <AdminUsersView
                  userSearch={userSearch}
                  setUserSearch={setUserSearch}
                  userTierFilter={userTierFilter}
                  setUserTierFilter={setUserTierFilter}
                  filteredUsers={filteredUsers}
                  users={users}
                  USER_COLUMNS={USER_COLUMNS}
                />
              )}

              {activeSection === "stylists" && <AdminStylistManager />}

              {activeSection === "services" && <AdminServiceManager />}

              {activeSection === "salons" && (
                <AdminSalonsView
                  salons={salons}
                  stylists={stylists}
                  bookings={bookings}
                />
              )}

              {activeSection === "vouchers" && (
                <AdminVouchersView
                  vouchers={vouchers}
                  VOUCHER_COLUMNS={VOUCHER_COLUMNS}
                  voucherModalOpen={voucherModalOpen}
                  setVoucherModalOpen={setVoucherModalOpen}
                  voucherForm={voucherForm}
                  handleCreateVoucherSubmit={handleCreateVoucherSubmit}
                  creatingVoucher={creatingVoucher}
                />
              )}

              {activeSection === "stats" && (
                <AdminStatsView
                  statsRange={statsRange}
                  setStatsRange={setStatsRange}
                  topServicesData={topServicesData}
                  stylists={stylists}
                  formatCurrency={formatCurrency}
                />
              )}

              {activeSection === "products" && (
                <AdminProductsView
                  productStats={productStats}
                  formatCurrency={formatCurrency}
                  products={products}
                  productSearch={productSearch}
                  setProductSearch={setProductSearch}
                  handleOpenProductModal={handleOpenProductModal}
                  handleDeleteProduct={handleDeleteProduct}
                  productModalOpen={productModalOpen}
                  setProductModalOpen={setProductModalOpen}
                  editingProduct={editingProduct}
                  productForm={productForm}
                  handleSaveProduct={handleSaveProduct}
                  savingProduct={savingProduct}
                  productCategories={productCategories}
                />
              )}

              {activeSection === "orders" && (
                <AdminOrdersView
                  orders={orders}
                  orderStatusFilter={orderStatusFilter}
                  setOrderStatusFilter={setOrderStatusFilter}
                  formatCurrency={formatCurrency}
                  selectedOrder={selectedOrder}
                  setSelectedOrder={setSelectedOrder}
                  orderModalOpen={orderModalOpen}
                  setOrderModalOpen={setOrderModalOpen}
                  handleUpdateOrderStatus={handleUpdateOrderStatus}
                />
              )}

              {activeSection === "reviews" && (
                <AdminReviewsView
                  reviews={reviews}
                  reviewSearch={reviewSearch}
                  setReviewSearch={setReviewSearch}
                  reviewFilterRating={reviewFilterRating}
                  setReviewFilterRating={setReviewFilterRating}
                  products={products}
                  handleDeleteReview={handleDeleteReview}
                />
              )}

              {activeSection === "settings" && <AdminSettingsView />}
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
          style={{ maxWidth: "95vw" }}
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

            <div className="flex justify-end gap-2 pt-2 flex-wrap">
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
          style={{ maxWidth: "95vw" }}
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
    </Layout>
  );
}
