import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Layout,
  Menu,
  Avatar,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Empty,
  Tabs,
  Badge,
  Spin,
  Tooltip,
  Button,
  Table,
  Input,
  Select,
  message,
  Progress,
  Divider,
  Switch,
  Rate,
  DatePicker,
  Modal,
  Popconfirm,
  Segmented,
  Space,
} from "antd";
import {
  CalendarOutlined,
  UserOutlined,
  BarChartOutlined,
  LogoutOutlined,
  ScissorOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StarOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  SearchOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CheckOutlined,
  PlayCircleOutlined,
  RiseOutlined,
  TrophyOutlined,
  FireOutlined,
  SmileOutlined,
  ScheduleOutlined,
  FilterOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  EyeOutlined,
  EditOutlined,
  InfoCircleOutlined,
  CheckSquareOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../auth/authProvider";
import { useNavigate } from "react-router-dom";
import notificationWs from "../../service/websocket/notificationWebSocket";
import {
  getBookingsByStylistAndStatus,
  getStylistStatistics,
  getBookingsByStylist,
} from "../../service/api/bookingApi";
import { getStylistById, getStylistServices, updateBookingStatus } from "../../service/api/adminApi";

const { Header, Sider, Content } = Layout;
const { Option } = Select;

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

const STATUS_TABS = [
  {
    key: "PENDING",
    label: "Chờ xác nhận",
    color: "gold",
    icon: <ClockCircleOutlined />,
  },
  {
    key: "CONFIRMED",
    label: "Lịch cắt tóc",
    color: "processing",
    icon: <ScissorOutlined />,
  },
  {
    key: "COMPLETED",
    label: "Đã hoàn thành",
    color: "success",
    icon: <CheckCircleOutlined />,
  },
  {
    key: "CANCELLED",
    label: "Đã hủy",
    color: "error",
    icon: <CloseCircleOutlined />,
  },
];

const formatCurrency = (val) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val ?? 0);

const formatDateTime = (dt) => {
  if (!dt) return "—";
  const d = Array.isArray(dt) ? new Date(...dt) : new Date(dt);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const STATUS_COLOR_MAP = {
  PENDING: { bg: "bg-yellow-50/70", border: "border-yellow-200", dot: "bg-yellow-400", text: "text-yellow-800" },
  CONFIRMED: { bg: "bg-blue-50/70", border: "border-blue-200", dot: "bg-blue-500", text: "text-blue-800" },
  IN_PROGRESS: { bg: "bg-purple-50/70", border: "border-purple-200", dot: "bg-purple-500", text: "text-purple-800" },
  COMPLETED: { bg: "bg-green-50/70", border: "border-green-200", dot: "bg-green-500", text: "text-green-800" },
  CANCELLED: { bg: "bg-red-50/70", border: "border-red-200", dot: "bg-red-400", text: "text-red-700" },
};

const STATUS_LABELS = {
  PENDING: { label: "Chờ xác nhận", color: "gold" },
  CONFIRMED: { label: "Đã nhận lịch", color: "processing" },
  IN_PROGRESS: { label: "Đang cắt tóc", color: "purple" },
  COMPLETED: { label: "Hoàn thành", color: "success" },
  CANCELLED: { label: "Đã hủy", color: "error" },
};

export default function StylistDashboard() {
  const { userInfo, logout } = useAuth();
  const navigate = useNavigate();

  const stylistId = userInfo?.id;

  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [allStylistBookings, setAllStylistBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("PENDING");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filter for appointment management view
  const [filterSearch, setFilterSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [onDuty, setOnDuty] = useState(true);
  const [currentTime, setCurrentTime] = useState(() => new Date().toLocaleTimeString("vi-VN"));
  const [statsPeriod, setStatsPeriod] = useState('week'); // 'day', 'week', 'month', 'year'
  const [periodSearch, setPeriodSearch] = useState('');
  const [periodStatusFilter, setPeriodStatusFilter] = useState('ALL');
  const [showPeriodTable, setShowPeriodTable] = useState(true);

  // ── STATE CHO PHẦN "LỊCH CẮT TÓC" (HAIRCUT SCHEDULE) ─────────────
  const [scheduleDateMode, setScheduleDateMode] = useState("today"); // 'today', 'tomorrow', 'week', 'all', 'custom'
  const [scheduleCustomDate, setScheduleCustomDate] = useState(null);
  const [scheduleShiftFilter, setScheduleShiftFilter] = useState("ALL"); // 'ALL', 'MORNING', 'AFTERNOON', 'EVENING'
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState("ALL");
  const [scheduleSearch, setScheduleSearch] = useState("");
  const [scheduleViewMode, setScheduleViewMode] = useState("cards"); // 'cards', 'table'

  // Modal ghi chú riêng của Stylist
  const [stylistNoteModalOpen, setStylistNoteModalOpen] = useState(false);
  const [selectedBookingForNote, setSelectedBookingForNote] = useState(null);
  const [stylistNoteText, setStylistNoteText] = useState("");
  const [stylistNotes, setStylistNotes] = useState(() => {
    try {
      const saved = localStorage.getItem("stylist_personal_notes");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleOpenStylistNote = (b) => {
    setSelectedBookingForNote(b);
    const bookingKey = b.id || b.bookingCode;
    setStylistNoteText(stylistNotes[bookingKey] || "");
    setStylistNoteModalOpen(true);
  };

  const handleSaveStylistNote = () => {
    if (!selectedBookingForNote) return;
    const bookingKey = selectedBookingForNote.id || selectedBookingForNote.bookingCode;
    const updated = { ...stylistNotes, [bookingKey]: stylistNoteText };
    setStylistNotes(updated);
    try {
      localStorage.setItem("stylist_personal_notes", JSON.stringify(updated));
    } catch (e) {}
    message.success("Đã lưu ghi chú thợ cắt tóc thành công!");
    setStylistNoteModalOpen(false);
  };

  // Modal chi tiết khách hàng
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [selectedCustomerBooking, setSelectedCustomerBooking] = useState(null);
  const handleOpenCustomerDetail = (b) => {
    setSelectedCustomerBooking(b);
    setCustomerModalOpen(true);
  };

  // Live Digital Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("vi-VN"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadAllDataQuietly = useCallback(async () => {
    if (!stylistId) return;
    try {
      const [statsData, profileData, servicesData, bookingsData] = await Promise.allSettled([
        getStylistStatistics(stylistId),
        getStylistById(stylistId),
        getStylistServices(stylistId),
        getBookingsByStylist(stylistId),
      ]);

      if (statsData.status === "fulfilled") setStats(statsData.value);
      if (profileData.status === "fulfilled") setProfile(profileData.value);
      if (servicesData.status === "fulfilled") setServices(servicesData.value || []);
      if (bookingsData.status === "fulfilled") setAllStylistBookings(bookingsData.value || []);
    } catch (err) {
      console.error("Error quietly reloading stylist data:", err);
    }
  }, [stylistId]);

  const loadAllData = useCallback(async () => {
    if (!stylistId) return;
    setLoading(true);
    try {
      await loadAllDataQuietly();
    } finally {
      setLoading(false);
    }
  }, [stylistId, loadAllDataQuietly]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Real-time WebSocket connection & auto-sync for Stylist
  useEffect(() => {
    if (!stylistId) return;

    notificationWs.connect({ stylistId, userId: stylistId });

    const unsubscribe = notificationWs.subscribe((data) => {
      console.log("⚡ Stylist received real-time WebSocket update:", data);
      loadAllDataQuietly();

      if (data.event === "NEW_BOOKING" || data.type === "BOOKING_CREATED") {
        message.info({
          content: `🔔 Có đơn đặt lịch mới từ khách hàng: ${data.customerName || data.bookingCode || "Khách hàng"}`,
          duration: 4,
        });
      } else if (data.event === "BOOKING_STATUS_CHANGED") {
        message.info({
          content: `🔄 Lịch hẹn ${data.bookingCode || ""} đã chuyển sang trạng thái "${data.status}"`,
          duration: 3,
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [stylistId, loadAllDataQuietly]);

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      message.success("Đã cập nhật trạng thái lịch hẹn!");
      loadAllDataQuietly();
    } catch (err) {
      message.error("Cập nhật thất bại!");
    }
  };

  // Safe stats values
  const pendingCount = stats?.pending ?? stats?.pendingCount ?? allStylistBookings.filter(b => b.status === "PENDING").length;
  const confirmedCount = stats?.confirmed ?? stats?.confirmedCount ?? allStylistBookings.filter(b => b.status === "CONFIRMED").length;
  const completedCount = stats?.completed ?? stats?.completedCount ?? allStylistBookings.filter(b => b.status === "COMPLETED").length;
  const cancelledCount = stats?.cancelled ?? stats?.cancelledCount ?? allStylistBookings.filter(b => b.status === "CANCELLED").length;
  const totalCount = stats?.total ?? stats?.totalCount ?? allStylistBookings.length;

  // Calculate 7-day trend metrics (Revenue & Appointments)
  const last7DaysMetrics = useMemo(() => {
    const days = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = `${d.getDate()}/${d.getMonth() + 1}`;
      
      const dayBookings = allStylistBookings.filter(b => {
        if (!b.startTime) return false;
        const bDate = Array.isArray(b.startTime)
          ? new Date(...b.startTime).toISOString().slice(0, 10)
          : new Date(b.startTime).toISOString().slice(0, 10);
        return bDate === dateStr;
      });

      const dayRevenue = dayBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      const dayCount = dayBookings.length;

      days.push({
        dateStr,
        dayLabel,
        revenue: dayRevenue,
        count: dayCount,
      });
    }
    return days;
  }, [allStylistBookings]);

  // Status Distribution Calculation
  const statusDistribution = useMemo(() => {
    const total = totalCount > 0 ? totalCount : 1;
    return [
      { label: "Chờ xác nhận", count: pendingCount, percent: Math.round((pendingCount / total) * 100), color: "#f59e0b", bg: "bg-amber-500" },
      { label: "Lịch cắt tóc", count: confirmedCount, percent: Math.round((confirmedCount / total) * 100), color: "#3b82f6", bg: "bg-blue-500" },
      { label: "Đã hoàn thành", count: completedCount, percent: Math.round((completedCount / total) * 100), color: "#10b981", bg: "bg-emerald-500" },
      { label: "Đã hủy", count: cancelledCount, percent: Math.round((cancelledCount / total) * 100), color: "#ef4444", bg: "bg-red-500" },
    ];
  }, [pendingCount, confirmedCount, completedCount, cancelledCount, totalCount]);

  const periodMetrics = useMemo(() => {
    const now = new Date();
    let startDate;
    
    switch (statsPeriod) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week': {
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
        startDate = new Date(now.getFullYear(), now.getMonth(), diff);
        break;
      }
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    }
    
    const periodBookings = allStylistBookings.filter(b => {
      if (!b.startTime) return false;
      const bDate = Array.isArray(b.startTime) ? new Date(...b.startTime) : new Date(b.startTime);
      return bDate >= startDate && bDate <= now;
    });
    
    const completed = periodBookings.filter(b => b.status === 'COMPLETED');
    const cancelled = periodBookings.filter(b => b.status === 'CANCELLED');
    const pending = periodBookings.filter(b => b.status === 'PENDING');
    const confirmed = periodBookings.filter(b => b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS');
    
    const revenue = completed.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
    const completionRate = periodBookings.length > 0 ? Math.round((completed.length / periodBookings.length) * 100) : 0;
    const avgRevenue = completed.length > 0 ? Math.round(revenue / completed.length) : 0;
    
    // Build chart data based on period
    const chartData = [];
    if (statsPeriod === 'day') {
      // Hourly: 0h-23h
      for (let h = 0; h < 24; h++) {
        const hourBookings = periodBookings.filter(b => {
          const d = Array.isArray(b.startTime) ? new Date(...b.startTime) : new Date(b.startTime);
          return d.getHours() === h;
        });
        chartData.push({ label: `${h}h`, count: hourBookings.length, revenue: hourBookings.filter(b => b.status === 'COMPLETED').reduce((s, b) => s + (Number(b.totalAmount) || 0), 0) });
      }
    } else if (statsPeriod === 'week') {
      // Daily Mon-Sun
      const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + d);
        const dayStr = dayDate.toISOString().slice(0, 10);
        const dayBooks = allStylistBookings.filter(b => {
          if (!b.startTime) return false;
          const bd = Array.isArray(b.startTime) ? new Date(...b.startTime) : new Date(b.startTime);
          return bd.toISOString().slice(0, 10) === dayStr;
        });
        chartData.push({ label: weekDays[d], count: dayBooks.length, revenue: dayBooks.filter(b => b.status === 'COMPLETED').reduce((s, b) => s + (Number(b.totalAmount) || 0), 0) });
      }
    } else if (statsPeriod === 'month') {
      // Weekly: Week 1, 2, 3, 4
      for (let w = 0; w < 5; w++) {
        const wStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1 + w * 7);
        const wEnd = new Date(startDate.getFullYear(), startDate.getMonth(), Math.min(7 + w * 7, new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate()));
        const wBooks = allStylistBookings.filter(b => {
          if (!b.startTime) return false;
          const bd = Array.isArray(b.startTime) ? new Date(...b.startTime) : new Date(b.startTime);
          return bd >= wStart && bd <= wEnd && bd.getMonth() === startDate.getMonth();
        });
        if (wStart.getDate() <= new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate())
          chartData.push({ label: `Tuần ${w+1}`, count: wBooks.length, revenue: wBooks.filter(b => b.status === 'COMPLETED').reduce((s, b) => s + (Number(b.totalAmount) || 0), 0) });
      }
    } else {
      // Monthly: T1-T12
      const months = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
      for (let m = 0; m < 12; m++) {
        const mBooks = allStylistBookings.filter(b => {
          if (!b.startTime) return false;
          const bd = Array.isArray(b.startTime) ? new Date(...b.startTime) : new Date(b.startTime);
          return bd.getFullYear() === now.getFullYear() && bd.getMonth() === m;
        });
        chartData.push({ label: months[m], count: mBooks.length, revenue: mBooks.filter(b => b.status === 'COMPLETED').reduce((s, b) => s + (Number(b.totalAmount) || 0), 0) });
      }
    }
    
    return {
      total: periodBookings.length,
      completed: completed.length,
      cancelled: cancelled.length,
      pending: pending.length,
      confirmed: confirmed.length,
      revenue,
      completionRate,
      avgRevenue,
      chartData,
      bookings: periodBookings,
    };
  }, [allStylistBookings, statsPeriod]);

  // Filtered bookings for the period breakdown table
  const filteredPeriodBookings = useMemo(() => {
    let list = periodMetrics.bookings || [];
    if (periodStatusFilter !== 'ALL') {
      list = list.filter((b) => b.status === periodStatusFilter);
    }
    if (periodSearch.trim()) {
      const q = periodSearch.toLowerCase();
      list = list.filter(
        (b) =>
          b.bookingCode?.toLowerCase().includes(q) ||
          b.userName?.toLowerCase().includes(q) ||
          b.customerName?.toLowerCase().includes(q) ||
          b.serviceName?.toLowerCase().includes(q) ||
          b.userPhone?.toLowerCase().includes(q) ||
          b.customerPhone?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [periodMetrics.bookings, periodStatusFilter, periodSearch]);

  // Top Performing Services for this Stylist
  const topServicesData = useMemo(() => {
    if (services.length > 0) {
      const totalStylistBookings = allStylistBookings.length || 1;
      return services.slice(0, 5).map((srv) => {
        const count = allStylistBookings.filter(b => b.serviceName === srv.serviceName).length;
        return {
          id: srv.id,
          name: srv.serviceName,
          price: srv.price,
          count,
          percentage: Math.min(100, Math.round((count / totalStylistBookings) * 100)),
        };
      }).sort((a, b) => b.count - a.count);
    }
    return [];
  }, [services, allStylistBookings]);

  // Thẻ phân loại ca làm việc
  const getShiftBadge = (startTime) => {
    if (!startTime) return { label: "Chưa xác định", color: "default", tag: "Ca linh hoạt" };
    const d = Array.isArray(startTime) ? new Date(...startTime) : new Date(startTime);
    const h = d.getHours();
    if (h >= 8 && h < 12) return { label: "Ca Sáng (08:00 - 12:00)", color: "blue", tag: "Ca Sáng" };
    if (h >= 12 && h < 17) return { label: "Ca Chiều (12:00 - 17:00)", color: "orange", tag: "Ca Chiều" };
    return { label: "Ca Tối (17:00 - 21:00)", color: "purple", tag: "Ca Tối" };
  };

  // Danh sách lịch hẹn phục vụ cho mục "Lịch cắt tóc"
  const haircutScheduleBookings = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

    // Đầu tuần (Thứ 2) và cuối tuần (Chủ nhật)
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(monday.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return allStylistBookings.filter((b) => {
      if (!b.startTime) return false;
      const bDate = Array.isArray(b.startTime) ? new Date(...b.startTime) : new Date(b.startTime);
      const bDateStr = `${bDate.getFullYear()}-${String(bDate.getMonth() + 1).padStart(2, '0')}-${String(bDate.getDate()).padStart(2, '0')}`;
      const hour = bDate.getHours();

      // 1. Lọc theo ngày
      if (scheduleDateMode === "today" && bDateStr !== todayStr) return false;
      if (scheduleDateMode === "tomorrow" && bDateStr !== tomorrowStr) return false;
      if (scheduleDateMode === "week" && (bDate < monday || bDate > sunday)) return false;
      if (scheduleDateMode === "custom" && scheduleCustomDate) {
        const customStr = typeof scheduleCustomDate === 'string'
          ? scheduleCustomDate
          : scheduleCustomDate.format ? scheduleCustomDate.format('YYYY-MM-DD')
          : new Date(scheduleCustomDate).toISOString().slice(0, 10);
        if (bDateStr !== customStr) return false;
      }

      // 2. Lọc theo ca làm việc (Shift)
      if (scheduleShiftFilter === "MORNING" && (hour < 8 || hour >= 12)) return false;
      if (scheduleShiftFilter === "AFTERNOON" && (hour < 12 || hour >= 17)) return false;
      if (scheduleShiftFilter === "EVENING" && (hour < 17 || hour >= 22)) return false;

      // 3. Lọc theo trạng thái
      if (scheduleStatusFilter !== "ALL" && b.status !== scheduleStatusFilter) return false;

      // 4. Tìm kiếm khách hàng / SĐT / mã đặt
      if (scheduleSearch && scheduleSearch.trim()) {
        const q = scheduleSearch.trim().toLowerCase();
        const code = (b.bookingCode || "").toLowerCase();
        const name = (b.customerName || b.userName || "").toLowerCase();
        const phone = (b.customerPhone || b.userPhone || "").toLowerCase();
        const srv = (b.serviceName || "").toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !phone.includes(q) && !srv.includes(q)) return false;
      }

      return true;
    }).sort((a, b) => {
      const da = Array.isArray(a.startTime) ? new Date(...a.startTime) : new Date(a.startTime);
      const db = Array.isArray(b.startTime) ? new Date(...b.startTime) : new Date(b.startTime);
      return da - db;
    });
  }, [allStylistBookings, scheduleDateMode, scheduleCustomDate, scheduleShiftFilter, scheduleStatusFilter, scheduleSearch]);

  const haircutKpis = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayBookings = allStylistBookings.filter(b => {
      if (!b.startTime) return false;
      const bd = Array.isArray(b.startTime) ? new Date(...b.startTime) : new Date(b.startTime);
      const bdStr = `${bd.getFullYear()}-${String(bd.getMonth() + 1).padStart(2, '0')}-${String(bd.getDate()).padStart(2, '0')}`;
      return bdStr === todayStr;
    });

    const inProgress = allStylistBookings.filter(b => b.status === "IN_PROGRESS").length;
    const confirmedToday = todayBookings.filter(b => b.status === "CONFIRMED").length;
    const completedToday = todayBookings.filter(b => b.status === "COMPLETED").length;
    const pendingToday = todayBookings.filter(b => b.status === "PENDING").length;
    const todayRevenue = todayBookings.filter(b => b.status === "COMPLETED").reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

    return {
      todayCount: todayBookings.length,
      inProgress,
      confirmedToday,
      completedToday,
      pendingToday,
      todayRevenue,
    };
  }, [allStylistBookings]);

  const menuItems = [
    { key: "dashboard", icon: <BarChartOutlined />, label: "Tổng quan & Thống kê" },
    { key: "haircut_schedule", icon: <ScissorOutlined />, label: "Lịch cắt tóc" },
    { key: "appointments", icon: <CalendarOutlined />, label: `Quản lý lịch (${allStylistBookings.length})` },
    { key: "services", icon: <ThunderboltOutlined />, label: `Dịch vụ đảm nhiệm (${services.length})` },
    { key: "profile", icon: <UserOutlined />, label: "Hồ sơ cá nhân" },
    { type: "divider" },
    { key: "logout", icon: <LogoutOutlined />, label: "Đăng xuất", danger: true },
  ];

  // Filtered list for appointments view
  const filteredAppointments = allStylistBookings.filter((b) => {
    const matchSearch =
      !filterSearch ||
      (b.bookingCode && b.bookingCode.toLowerCase().includes(filterSearch.toLowerCase())) ||
      (b.customerName && b.customerName.toLowerCase().includes(filterSearch.toLowerCase())) ||
      (b.customerPhone && b.customerPhone.includes(filterSearch));
    const matchStatus = filterStatus === "ALL" || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Booking Card in tab view
  const renderBookingCard = (b) => {
    const c = STATUS_COLOR_MAP[b.status] ?? STATUS_COLOR_MAP.PENDING;
    return (
      <div
        key={b.id || b.bookingCode}
        className={`rounded-2xl border p-5 mb-3.5 ${c.bg} ${c.border} transition-all hover:shadow-md bg-white`}
      >
        <div className="flex items-start justify-between mb-2.5">
          <div className="flex items-center gap-3">
            <Avatar size={42} icon={<UserOutlined />} className="bg-slate-700 text-white" />
            <div>
              <p className="font-bold text-gray-900 text-sm mb-0">
                {b.customerName || "Khách hàng"}
              </p>
              <p className="text-gray-500 text-xs mb-0">📞 {b.customerPhone || "—"}</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${c.text} bg-white border ${c.border}`}>
            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
            {b.bookingCode || "—"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 bg-slate-50/60 p-3 rounded-xl border border-gray-100 my-3">
          <div>
            <span className="text-gray-400">Khung giờ:</span>{" "}
            <strong>{formatDateTime(b.startTime)}</strong>
          </div>
          <div>
            <span className="text-gray-400">Kết thúc dự kiến:</span>{" "}
            <strong>{formatDateTime(b.endTime)}</strong>
          </div>
          <div>
            <span className="text-gray-400">Tổng tiền:</span>{" "}
            <strong className="text-amber-700">{formatCurrency(b.totalAmount)}</strong>
          </div>
          <div>
            <span className="text-gray-400">Thanh toán:</span>{" "}
            <span>{b.paymentMethod === "CASH" ? "💵 Tiền mặt" : "🏦 Chuyển khoản QR"}</span>
          </div>
        </div>

        {b.customerNotes && (
          <p className="text-xs text-gray-600 italic bg-amber-50/70 border border-amber-100 rounded-lg px-3 py-2 mb-3">
            💬 Yêu cầu của khách: "{b.customerNotes}"
          </p>
        )}

        {/* Quick Actions for Stylist */}
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
          {b.status === "PENDING" && (
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleStatusChange(b.id, "CONFIRMED")}
              className="bg-blue-600 font-bold rounded-lg"
            >
              Nhận lịch này
            </Button>
          )}

          {b.status === "CONFIRMED" && (
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStatusChange(b.id, "IN_PROGRESS")}
              className="bg-purple-600 font-bold rounded-lg"
            >
              Bắt đầu cắt tóc
            </Button>
          )}

          {b.status === "IN_PROGRESS" && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleStatusChange(b.id, "COMPLETED")}
              className="bg-green-600 font-bold rounded-lg"
            >
              Hoàn thành dịch vụ
            </Button>
          )}

          {b.status !== "COMPLETED" && b.status !== "CANCELLED" && (
            <Button
              size="small"
              danger
              onClick={() => handleStatusChange(b.id, "CANCELLED")}
              className="rounded-lg"
            >
              Hủy lịch
            </Button>
          )}
        </div>
      </div>
    );
  };

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
            <div className="w-12 h-12 bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl flex items-center justify-center mb-2.5 shadow-md">
              <ScissorOutlined className="text-white text-2xl" />
            </div>
            <span className="text-slate-900 font-black text-sm tracking-widest uppercase">
              STYLIST PORTAL
            </span>
            <span className="text-gray-400 text-xs font-semibold">BachBarber Pro Staff</span>
          </div>
        )}

        {/* Avatar & Rank */}
        {!collapsed && (
          <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-slate-50/60">
            <Avatar
              size={48}
              src={profile?.avatarUrl || userInfo?.avatarUrl}
              icon={<UserOutlined />}
              className="border-2 border-slate-700"
            />
            <div className="overflow-hidden">
              <p className="font-bold text-gray-900 text-xs truncate mb-0.5">
                {profile?.fullName || userInfo?.fullName || userInfo?.username || "Stylist"}
              </p>
              <Tag color="geekblue" className="text-[10px] font-bold px-1.5 py-0 leading-none">
                {profile?.levelRank || "SENIOR"} STYLIST
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

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <Layout>
        {/* Modern Header with Glassmorphism, Duty Switch, Live Clock, and WebSocket Live Sync */}
        <Header className="bg-white/85 backdrop-blur-md px-6 md:px-8 flex items-center justify-between shadow-xs border-b border-gray-100 h-16 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-gray-800 mb-0">
              Xin chào,{" "}
              <span className="text-blue-600 font-black">
                {profile?.fullName || userInfo?.fullName || userInfo?.username}
              </span>{" "}
              👋
            </h1>
            <Tag color="gold" className="text-xs hidden sm:inline-flex font-semibold">
              📍 {profile?.salonName || "Hệ thống BachBarber"}
            </Tag>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Live Clock */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-500 font-mono bg-slate-50 px-3 py-1 rounded-lg border border-gray-100">
              <ClockCircleOutlined className="text-blue-500" />
              <span>{currentTime}</span>
            </div>

            {/* Duty Switch */}
            <div className="flex items-center gap-1.5 text-xs">
              <Switch
                checked={onDuty}
                onChange={(checked) => {
                  setOnDuty(checked);
                  message.info(checked ? "Đã bật chế độ sẵn sàng nhận khách" : "Đã chuyển sang trạng thái tạm nghỉ");
                }}
                checkedChildren="Đang trực"
                unCheckedChildren="Tạm nghỉ"
                className={onDuty ? "bg-emerald-600" : "bg-gray-400"}
              />
            </div>

            {/* Real-time WebSocket Live Sync Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 text-xs font-semibold shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden sm:inline">Live Sync</span>
            </div>

            <Avatar
              size={36}
              src={profile?.avatarUrl || userInfo?.avatarUrl}
              icon={<UserOutlined />}
              className="border-2 border-blue-100"
            />
          </div>
        </Header>

        <Content className="p-6 md:p-8 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-32">
              <Spin size="large" tip="Đang tải dữ liệu stylist..." />
            </div>
          ) : (
            <>
              {/* ═══════════════════════════════════════════════════════ */}
              {/* VIEW 1: DASHBOARD & STATISTICAL CHARTS                  */}
              {/* ═══════════════════════════════════════════════════════ */}
              {activeSection === "dashboard" && (
                <div className="space-y-6">
                  {/* KPI Stat Cards */}
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} lg={6}>
                      <Card className="rounded-2xl border-gray-100 shadow-sm bg-gradient-to-br from-yellow-50/70 to-white">
                        <Statistic
                          title={<span className="text-xs font-bold uppercase text-amber-700 tracking-wider">Chờ xác nhận</span>}
                          value={pendingCount}
                          suffix={<span className="text-xs text-gray-400 font-normal">lịch</span>}
                          prefix={<ClockCircleOutlined className="text-amber-500 mr-1" />}
                          valueStyle={{ fontWeight: 900, color: "#78350f" }}
                        />
                        <div className="mt-2 text-[11px] text-gray-400">Khách vừa đặt cần xác nhận</div>
                      </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                      <Card className="rounded-2xl border-gray-100 shadow-sm bg-gradient-to-br from-blue-50/70 to-white">
                        <Statistic
                          title={<span className="text-xs font-bold uppercase text-blue-700 tracking-wider">Lịch cắt tóc</span>}
                          value={confirmedCount}
                          suffix={<span className="text-xs text-gray-400 font-normal">lịch</span>}
                          prefix={<ScissorOutlined className="text-blue-500 mr-1" />}
                          valueStyle={{ fontWeight: 900, color: "#1e3a8a" }}
                        />
                        <div className="mt-2 text-[11px] text-blue-600 font-semibold">Đã lên lịch đón tiếp</div>
                      </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                      <Card className="rounded-2xl border-gray-100 shadow-sm bg-gradient-to-br from-green-50/70 to-white">
                        <Statistic
                          title={<span className="text-xs font-bold uppercase text-green-700 tracking-wider">Đã hoàn thành</span>}
                          value={completedCount}
                          suffix={<span className="text-xs text-gray-400 font-normal">lượt</span>}
                          prefix={<CheckCircleOutlined className="text-green-500 mr-1" />}
                          valueStyle={{ fontWeight: 900, color: "#14532d" }}
                        />
                        <div className="mt-2 text-[11px] text-green-600 font-semibold">Đã hoàn tất thanh toán</div>
                      </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                      <Card className="rounded-2xl border-gray-100 shadow-sm bg-gradient-to-br from-orange-50/70 to-white">
                        <Statistic
                          title={<span className="text-xs font-bold uppercase text-orange-700 tracking-wider">Đánh giá trung bình</span>}
                          value={Number(profile?.ratingAverage || 4.9).toFixed(1)}
                          suffix={<span className="text-xs text-amber-500 font-bold">★ ({profile?.totalReviewsCount || 100}+)</span>}
                          prefix={<StarOutlined className="text-amber-500 mr-1" />}
                          valueStyle={{ fontWeight: 900, color: "#c2410c" }}
                        />
                        <div className="mt-2 text-[11px] text-gray-400">Tổng phục vụ {profile?.totalServedBookings || 500} khách</div>
                      </Card>
                    </Col>
                  </Row>

                  {/* ── THỐNG KÊ THEO KỲ & BIỂU ĐỒ ĐƯỜNG (LINE CHART) ── */}
                  <Card className="rounded-2xl border-gray-100 shadow-sm">
                    {/* Header với Dropdown phân loại: ngày, tuần, tháng, năm nằm ngay phía trên chart */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                      <div>
                        <span className="font-bold text-base text-gray-800 flex items-center gap-2">
                          <RiseOutlined className="text-blue-600" />
                          Biểu đồ đường xu hướng Đánh giá & Doanh thu Stylist
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Đường biểu diễn Doanh thu (VNĐ) và Số lượt khách đặt cắt tóc theo thời gian thực
                        </p>
                      </div>

                      {/* Dropdown phân loại theo Ngày, Tuần, Tháng, Năm nằm ngay phía trên chart */}
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-gray-200 shadow-xs">
                        <span className="text-xs font-bold text-gray-600">Phân loại theo:</span>
                        <Select
                          value={statsPeriod}
                          onChange={(v) => setStatsPeriod(v)}
                          className="w-44 font-semibold"
                          options={[
                            { value: "day", label: "📅 Hôm nay (Ngày)" },
                            { value: "week", label: "🗓️ Tuần này (Tuần)" },
                            { value: "month", label: "📊 Tháng này (Tháng)" },
                            { value: "year", label: "📈 Năm này (Năm)" },
                          ]}
                        />
                      </div>
                    </div>
                    
                    {/* 4 Mini KPI cho kỳ được chọn */}
                    <Row gutter={[12, 12]} className="mb-4">
                      {[
                        { label: 'Tổng lịch trong kỳ', value: periodMetrics.total, color: 'text-gray-700', bg: 'bg-gray-50', icon: '📅' },
                        { label: 'Hoàn thành dịch vụ', value: periodMetrics.completed, color: 'text-green-700', bg: 'bg-green-50', icon: '✅' },
                        { label: 'Doanh thu trong kỳ', value: formatCurrency(periodMetrics.revenue), color: 'text-blue-700', bg: 'bg-blue-50', icon: '💰', isCurrency: true },
                        { label: 'Tỉ lệ hoàn thành', value: `${periodMetrics.completionRate}%`, color: 'text-purple-700', bg: 'bg-purple-50', icon: '📊' },
                      ].map(({label, value, color, bg, icon}) => (
                        <Col xs={12} sm={6} key={label}>
                          <div className={`${bg} rounded-xl p-3 text-center border border-gray-100`}>
                            <div className="text-xl mb-1">{icon}</div>
                            <div className={`text-lg font-black ${color}`}>{value}</div>
                            <div className="text-xs text-gray-500">{label}</div>
                          </div>
                        </Col>
                      ))}
                    </Row>
                    
                    {/* SVG Line Chart for Period */}
                    {(() => {
                      const chartData = periodMetrics.chartData || [];
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
                          {/* Legend & Unit */}
                          <div className="flex flex-wrap items-center justify-between mb-3 text-xs gap-2">
                            <div className="flex items-center gap-5">
                              <div className="flex items-center gap-2 font-bold text-blue-600">
                                <span className="w-5 h-1 bg-blue-600 rounded-full inline-block" />
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block -ml-3.5 border-2 border-white" />
                                <span>Đường Doanh thu (VNĐ)</span>
                              </div>
                              <div className="flex items-center gap-2 font-bold text-emerald-600">
                                <span className="w-5 h-1 bg-emerald-500 rounded-full inline-block border-t border-dashed" />
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block -ml-3.5 border-2 border-white" />
                                <span>Đường Số lượt cắt (Lịch)</span>
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
                                  <linearGradient id="stylistRevAreaGrad" x1="0" y1="0" x2="0" y2="1">
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
                                {areaPathRev && <path d={areaPathRev} fill="url(#stylistRevAreaGrad)" />}

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

                                {/* Appointments Count Line Curve */}
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
                                            <p className="text-xs text-sky-200 mb-0.5">💰 Doanh thu: <strong>{formatCurrency(pt.revenue)}</strong></p>
                                            <p className="text-xs text-emerald-200 mb-0">✂️ Lượt cắt: <strong>{pt.count} khách</strong></p>
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
                                      <Tooltip title={`${pt.label}: ${pt.count} lượt cắt`}>
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

                                      {/* X-axis Label */}
                                      <text
                                        x={pt.x}
                                        y={svgHeight - 12}
                                        textAnchor="middle"
                                        fontSize="10"
                                        fill="#64748b"
                                        fontWeight="600"
                                      >
                                        {pt.label}
                                      </text>
                                    </g>
                                  );
                                })}
                              </svg>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Detailed Appointments Breakdown for the Selected Period */}
                    <div className="mt-5 pt-4 border-t border-gray-100">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-800">
                            📋 Chi tiết lịch hẹn {statsPeriod === 'day' ? 'Hôm nay' : statsPeriod === 'week' ? 'Tuần này' : statsPeriod === 'month' ? 'Tháng này' : 'Năm này'}
                          </span>
                          <Tag color="blue" className="font-bold text-xs rounded-full">
                            {filteredPeriodBookings.length} lịch hẹn
                          </Tag>
                        </div>
                        <Button
                          size="small"
                          type="link"
                          onClick={() => setShowPeriodTable(!showPeriodTable)}
                          className="text-xs text-blue-600 font-semibold p-0"
                        >
                          {showPeriodTable ? '▲ Thu gọn' : '▼ Mở rộng danh sách'}
                        </Button>
                      </div>

                      {showPeriodTable && (
                        <div className="space-y-3">
                          {/* Search & Status Filters */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Input.Search
                              placeholder="Tìm mã lịch, tên khách, số điện thoại..."
                              value={periodSearch}
                              onChange={(e) => setPeriodSearch(e.target.value)}
                              allowClear
                              size="small"
                              className="w-full sm:w-64"
                            />
                            <div className="flex flex-wrap gap-1">
                              {[
                                { key: 'ALL', label: `Tất cả (${periodMetrics.total})` },
                                { key: 'COMPLETED', label: `Hoàn thành (${periodMetrics.completed})` },
                                { key: 'CONFIRMED', label: `Đã xác nhận (${periodMetrics.confirmed})` },
                                { key: 'PENDING', label: `Chờ duyệt (${periodMetrics.pending})` },
                                { key: 'CANCELLED', label: `Đã hủy (${periodMetrics.cancelled})` },
                              ].map(({ key, label }) => (
                                <button
                                  key={key}
                                  onClick={() => setPeriodStatusFilter(key)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                                    periodStatusFilter === key
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Appointments Table */}
                          <Table
                            dataSource={filteredPeriodBookings}
                            rowKey={(r) => r.id || r.bookingCode || Math.random()}
                            size="small"
                            scroll={{ x: 750 }}
                            pagination={{
                              pageSize: 5,
                              showSizeChanger: true,
                              pageSizeOptions: ['5', '10', '20'],
                              showTotal: (total) => `${total} lịch hẹn`,
                            }}
                            columns={[
                              {
                                title: 'Mã lịch',
                                dataIndex: 'bookingCode',
                                key: 'code',
                                width: 110,
                                render: (code) => (
                                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                    {code || '—'}
                                  </span>
                                ),
                              },
                              {
                                title: 'Thời gian',
                                dataIndex: 'startTime',
                                key: 'time',
                                width: 140,
                                render: (time) => (
                                  <span className="text-xs text-gray-700 font-medium">
                                    {formatDateTime(time)}
                                  </span>
                                ),
                              },
                              {
                                title: 'Khách hàng',
                                key: 'customer',
                                render: (_, r) => (
                                  <div>
                                    <p className="font-semibold text-xs text-gray-800 mb-0">
                                      {r.userName || r.customerName || 'Khách vãng lai'}
                                    </p>
                                    <p className="text-[11px] text-gray-400 mb-0">
                                      {r.userPhone || r.customerPhone || '—'}
                                    </p>
                                  </div>
                                ),
                              },
                              {
                                title: 'Dịch vụ',
                                dataIndex: 'serviceName',
                                key: 'service',
                                render: (name) => (
                                  <span className="text-xs font-medium text-gray-800 line-clamp-1">
                                    {name || 'Cắt tóc nam tiêu chuẩn'}
                                  </span>
                                ),
                              },
                              {
                                title: 'Doanh thu',
                                dataIndex: 'totalAmount',
                                key: 'amount',
                                width: 110,
                                render: (val) => (
                                  <span className="font-bold text-xs text-blue-700">
                                    {formatCurrency(val)}
                                  </span>
                                ),
                              },
                              {
                                title: 'Trạng thái',
                                dataIndex: 'status',
                                key: 'status',
                                width: 120,
                                render: (status) => {
                                  const tab = STATUS_TABS.find((t) => t.key === status);
                                  return (
                                    <Tag color={tab?.color || 'default'} className="text-[11px] font-semibold">
                                      {tab?.label || status}
                                    </Tag>
                                  );
                                },
                              },
                              {
                                title: 'Cập nhật',
                                key: 'action',
                                width: 130,
                                render: (_, r) => (
                                  <Select
                                    size="small"
                                    value={r.status}
                                    onChange={(newStatus) => handleStatusChange(r.id, newStatus)}
                                    className="w-full text-xs"
                                  >
                                    <Option value="PENDING">Chờ xác nhận</Option>
                                    <Option value="CONFIRMED">Lịch cắt tóc</Option>
                                    <Option value="COMPLETED">Đã hoàn thành</Option>
                                    <Option value="CANCELLED">Đã hủy</Option>
                                  </Select>
                                ),
                              },
                            ]}
                            locale={{
                              emptyText: (
                                <Empty
                                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                                  description="Không có lịch hẹn nào trong kỳ được chọn"
                                />
                              ),
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </Card>



                  {/* ── BIỂU ĐỒ 2 & 3: TỶ LỆ TRẠNG THÁI & ĐÁNH GIÁ KHÁCH HÀNG ── */}
                  <Row gutter={[16, 16]}>
                    {/* Status Distribution */}
                    <Col xs={24} lg={12}>
                      <Card className="rounded-2xl border-gray-100 shadow-sm h-full p-2">
                        <div className="px-3 pt-2 mb-3">
                          <span className="font-bold text-sm text-gray-800 flex items-center gap-2">
                            <BarChartOutlined className="text-amber-500" />
                            Phân bố trạng thái lịch hẹn
                          </span>
                          <span className="text-xs text-gray-400">Tỉ lệ hoàn tất so với các đơn chờ duyệt & đã hủy</span>
                        </div>

                        <div className="space-y-3.5 p-3 pt-1">
                          {statusDistribution.map((s, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <span className="text-gray-700 flex items-center gap-2">
                                  <span className={`w-2.5 h-2.5 rounded-full ${s.bg}`} />
                                  {s.label}
                                </span>
                                <span className="text-gray-500">
                                  <strong>{s.count}</strong> lịch ({s.percent}%)
                                </span>
                              </div>
                              <Progress
                                percent={s.percent}
                                showInfo={false}
                                strokeColor={s.color}
                                size="small"
                                className="mb-0"
                              />
                            </div>
                          ))}
                        </div>
                      </Card>
                    </Col>

                    {/* Customer Rating & Satisfaction */}
                    <Col xs={24} lg={12}>
                      <Card className="rounded-2xl border-gray-100 shadow-sm h-full p-2">
                        <div className="px-3 pt-2 mb-2 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-sm text-gray-800 flex items-center gap-2">
                              <SmileOutlined className="text-amber-500" />
                              Mức độ hài lòng & Đánh giá khách hàng
                            </span>
                            <span className="text-xs text-gray-400">Dựa trên phản hồi thực tế từ khách đã phục vụ</span>
                          </div>
                          <Tag color="gold" className="font-bold text-xs">
                            {Number(profile?.ratingAverage || 4.9).toFixed(1)} / 5.0 ★
                          </Tag>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 pt-1 items-center">
                          <div className="text-center sm:border-r border-gray-100 pr-2">
                            <h2 className="text-4xl font-black text-amber-500 mb-1">
                              {Number(profile?.ratingAverage || 4.9).toFixed(1)}
                            </h2>
                            <Rate disabled allowHalf defaultValue={4.9} className="text-amber-400 text-xs" />
                            <p className="text-[11px] text-gray-400 mt-1 mb-0">
                              {profile?.totalReviewsCount || 128} lượt đánh giá
                            </p>
                          </div>

                          <div className="sm:col-span-2 space-y-1.5 text-xs text-gray-600">
                            <div className="flex items-center gap-2">
                              <span className="w-10 text-right text-[11px] text-gray-400">5 sao</span>
                              <Progress percent={88} size="small" strokeColor="#f59e0b" showInfo={false} className="flex-1" />
                              <span className="w-8 text-[11px] text-gray-500 font-semibold">88%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-10 text-right text-[11px] text-gray-400">4 sao</span>
                              <Progress percent={9} size="small" strokeColor="#f59e0b" showInfo={false} className="flex-1" />
                              <span className="w-8 text-[11px] text-gray-500 font-semibold">9%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-10 text-right text-[11px] text-gray-400">3 sao</span>
                              <Progress percent={2} size="small" strokeColor="#f59e0b" showInfo={false} className="flex-1" />
                              <span className="w-8 text-[11px] text-gray-500 font-semibold">2%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-10 text-right text-[11px] text-gray-400">1-2 sao</span>
                              <Progress percent={1} size="small" strokeColor="#ef4444" showInfo={false} className="flex-1" />
                              <span className="w-8 text-[11px] text-gray-500 font-semibold">1%</span>
                            </div>
                          </div>
                        </div>

                        {/* Satisfaction Badges */}
                        <div className="grid grid-cols-3 gap-2 px-3 pt-3 border-t border-gray-100 text-center text-xs">
                          <div className="bg-slate-50 p-2 rounded-xl">
                            <span className="font-bold text-emerald-600 block text-sm">99.1%</span>
                            <span className="text-[10px] text-gray-400">Đúng giờ hẹn</span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-xl">
                            <span className="font-bold text-blue-600 block text-sm">98.5%</span>
                            <span className="text-[10px] text-gray-400">Hài lòng kiểu tóc</span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-xl">
                            <span className="font-bold text-purple-600 block text-sm">86.2%</span>
                            <span className="text-[10px] text-gray-400">Khách quay lại</span>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  {/* ── BIỂU ĐỒ 4: TOP DỊCH VỤ ĐƯỢC ĐẶT NHIỀU NHẤT ── */}
                  <Card className="rounded-2xl border-gray-100 shadow-sm p-2">
                    <div className="px-4 pt-2 mb-3 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm text-gray-800 flex items-center gap-2">
                          <FireOutlined className="text-red-500" />
                          Top dịch vụ chuyên môn được khách hàng đặt nhiều nhất
                        </span>
                        <span className="text-xs text-gray-400">Thứ tự các dịch vụ mang lại doanh thu và sự hài lòng cao nhất</span>
                      </div>
                      <Tag color="volcano" className="text-xs font-semibold">Top Performance</Tag>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4 pt-1">
                      {topServicesData.slice(0, 3).map((srv, idx) => (
                        <div
                          key={srv.id}
                          className="bg-slate-50/80 border border-gray-100 rounded-2xl p-3.5 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                                idx === 0 ? "bg-amber-500" : idx === 1 ? "bg-slate-400" : "bg-amber-700"
                              }`}>
                                #{idx + 1}
                              </span>
                              <span className="font-bold text-xs text-gray-800 line-clamp-1">{srv.name}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                            <span>Giá: <strong className="text-amber-700">{formatCurrency(srv.price)}</strong></span>
                            <span><strong>{srv.count}</strong> lượt đặt</span>
                          </div>
                          <Progress percent={srv.percentage} strokeColor="#3b82f6" size="small" showInfo={false} />
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* ── DANH SÁCH LỊCH HẸN THEO TRẠNG THÁI (TAB VIEW) ── */}
                  <Card className="rounded-2xl border-gray-100 shadow-sm p-2">
                    <div className="flex items-center justify-between px-4 pt-2 mb-2">
                      <span className="font-bold text-base text-gray-800 flex items-center gap-2">
                        <CalendarOutlined className="text-blue-500" />
                        Danh sách lịch hẹn theo trạng thái
                      </span>
                      <Tag color="cyan">Tổng: {totalCount} đơn</Tag>
                    </div>

                    <Tabs
                      activeKey={activeTab}
                      onChange={setActiveTab}
                      items={STATUS_TABS.map((t) => {
                        let count = 0;
                        if (t.key === "PENDING") count = pendingCount;
                        if (t.key === "CONFIRMED") count = confirmedCount;
                        if (t.key === "COMPLETED") count = completedCount;
                        if (t.key === "CANCELLED") count = cancelledCount;

                        const tabBookings = allStylistBookings.filter((b) => {
                          if (t.key === "CONFIRMED") return b.status === "CONFIRMED" || b.status === "IN_PROGRESS";
                          return b.status === t.key;
                        });

                        return {
                          key: t.key,
                          label: (
                            <span className="flex items-center gap-1.5 text-xs font-semibold">
                              {t.icon}
                              {t.label} ({count})
                            </span>
                          ),
                          children: (
                            <div className="mt-2">
                              {tabBookings.length === 0 ? (
                                <Empty
                                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                                  description={<span className="text-gray-400 text-xs">Không có lịch hẹn trong mục này</span>}
                                  className="py-12"
                                />
                              ) : (
                                <div className="space-y-3">
                                  {tabBookings.map((b) => renderBookingCard(b))}
                                </div>
                              )}
                            </div>
                          ),
                        };
                      })}
                    />
                  </Card>
                </div>
              )}


              {/* ═══════════════════════════════════════════════════════ */}
              {/* VIEW: LỊCH CẮT TÓC (HAIRCUT SCHEDULE)                   */}
              {/* ═══════════════════════════════════════════════════════ */}
              {activeSection === "haircut_schedule" && (
                <div className="space-y-6">
                  {/* Top Bar Header */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                    <div>
                      <h2 className="text-lg font-black text-gray-900 mb-1 flex items-center gap-2">
                        <ScissorOutlined className="text-blue-600" />
                        Lịch cắt tóc Stylist
                      </h2>
                      <p className="text-xs text-gray-500 mb-0">
                        Theo dõi ca phục vụ, phân loại theo khung giờ làm việc và thao tác chuyển đổi trạng thái trực tiếp
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Segmented
                        value={scheduleViewMode}
                        onChange={setScheduleViewMode}
                        options={[
                          { label: "Dạng Thẻ", value: "cards", icon: <AppstoreOutlined /> },
                          { label: "Dạng Bảng", value: "table", icon: <UnorderedListOutlined /> },
                        ]}
                        className="p-1 font-semibold"
                      />
                      <Tag color="blue" className="px-3 py-1 font-bold text-xs rounded-full">
                        {haircutScheduleBookings.length} lịch phù hợp
                      </Tag>
                    </div>
                  </div>

                  {/* 5 KPI Quick Metric Cards */}
                  <Row gutter={[12, 12]}>
                    <Col xs={12} sm={8} lg={4}>
                      <Card className="rounded-2xl border-gray-100 shadow-xs p-3 text-center bg-blue-50/50">
                        <span className="text-[11px] font-bold uppercase text-blue-700">Lịch hôm nay</span>
                        <div className="text-2xl font-black text-blue-900 mt-1">{haircutKpis.todayCount}</div>
                        <span className="text-[10px] text-gray-400">Khách đặt ngày</span>
                      </Card>
                    </Col>
                    <Col xs={12} sm={8} lg={5}>
                      <Card className="rounded-2xl border-purple-200 shadow-xs p-3 text-center bg-purple-50/60 relative overflow-hidden">
                        <div className="absolute top-2 right-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
                          </span>
                        </div>
                        <span className="text-[11px] font-bold uppercase text-purple-700">Đang cắt tóc</span>
                        <div className="text-2xl font-black text-purple-900 mt-1">{haircutKpis.inProgress}</div>
                        <span className="text-[10px] text-purple-600 font-semibold">Đang trên ghế phục vụ</span>
                      </Card>
                    </Col>
                    <Col xs={12} sm={8} lg={5}>
                      <Card className="rounded-2xl border-gray-100 shadow-xs p-3 text-center bg-sky-50/50">
                        <span className="text-[11px] font-bold uppercase text-sky-700">Chờ đón tiếp</span>
                        <div className="text-2xl font-black text-sky-900 mt-1">{haircutKpis.confirmedToday}</div>
                        <span className="text-[10px] text-gray-400">Đã xác nhận hôm nay</span>
                      </Card>
                    </Col>
                    <Col xs={12} sm={8} lg={5}>
                      <Card className="rounded-2xl border-gray-100 shadow-xs p-3 text-center bg-green-50/50">
                        <span className="text-[11px] font-bold uppercase text-green-700">Đã xong hôm nay</span>
                        <div className="text-2xl font-black text-green-900 mt-1">{haircutKpis.completedToday}</div>
                        <span className="text-[10px] text-gray-400">Đã hoàn thành</span>
                      </Card>
                    </Col>
                    <Col xs={24} sm={8} lg={5}>
                      <Card className="rounded-2xl border-gray-100 shadow-xs p-3 text-center bg-amber-50/50">
                        <span className="text-[11px] font-bold uppercase text-amber-700">Doanh thu hôm nay</span>
                        <div className="text-lg font-black text-amber-900 mt-1 truncate">{formatCurrency(haircutKpis.todayRevenue)}</div>
                        <span className="text-[10px] text-gray-400">Tạm tính ca hôm nay</span>
                      </Card>
                    </Col>
                  </Row>

                  {/* Filter Toolbar: Date / Shift / Status / Search */}
                  <Card className="rounded-2xl border-gray-100 shadow-sm p-4">
                    <div className="flex flex-col gap-4">
                      {/* Row 1: Date filters & Search */}
                      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                        {/* Quick Date Buttons */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {[
                            { key: "today", label: "Hôm nay" },
                            { key: "tomorrow", label: "Ngày mai" },
                            { key: "week", label: "Tuần này" },
                            { key: "all", label: "Tất cả" },
                          ].map(({ key, label }) => (
                            <Button
                              key={key}
                              size="small"
                              type={scheduleDateMode === key ? "primary" : "default"}
                              onClick={() => {
                                setScheduleDateMode(key);
                                setScheduleCustomDate(null);
                              }}
                              className={`rounded-lg font-bold text-xs ${
                                scheduleDateMode === key ? "bg-blue-600" : "text-gray-600"
                              }`}
                            >
                              {label}
                            </Button>
                          ))}

                          {/* Custom DatePicker */}
                          <DatePicker
                            size="small"
                            placeholder="Chọn ngày khác"
                            className="rounded-lg text-xs"
                            onChange={(date, dateString) => {
                              if (dateString) {
                                setScheduleCustomDate(dateString);
                                setScheduleDateMode("custom");
                              } else {
                                setScheduleCustomDate(null);
                                setScheduleDateMode("today");
                              }
                            }}
                          />
                        </div>

                        {/* Search Input */}
                        <Input.Search
                          placeholder="Tìm tên khách, số điện thoại, mã lịch, dịch vụ..."
                          allowClear
                          value={scheduleSearch}
                          onChange={(e) => setScheduleSearch(e.target.value)}
                          className="w-full md:w-80 rounded-xl"
                        />
                      </div>

                      {/* Row 2: Shift Filter & Status Filter */}
                      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3 border-t border-gray-100">
                        {/* Shift Filter (Ca làm việc) */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                            <ClockCircleOutlined /> Ca làm việc:
                          </span>
                          {[
                            { key: "ALL", label: "Tất cả ca" },
                            { key: "MORNING", label: "🌅 Ca Sáng (08h - 12h)" },
                            { key: "AFTERNOON", label: "☀️ Ca Chiều (12h - 17h)" },
                            { key: "EVENING", label: "🌙 Ca Tối (17h - 21h)" },
                          ].map(({ key, label }) => (
                            <button
                              key={key}
                              onClick={() => setScheduleShiftFilter(key)}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                scheduleShiftFilter === key
                                  ? "bg-slate-900 text-white shadow-xs"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-500">Trạng thái:</span>
                          <Select
                            value={scheduleStatusFilter}
                            onChange={setScheduleStatusFilter}
                            size="small"
                            className="w-44"
                            options={[
                              { value: "ALL", label: "Tất cả trạng thái" },
                              { value: "PENDING", label: "Chờ xác nhận" },
                              { value: "CONFIRMED", label: "Đã xác nhận" },
                              { value: "IN_PROGRESS", label: "Đang cắt tóc" },
                              { value: "COMPLETED", label: "Đã hoàn thành" },
                              { value: "CANCELLED", label: "Đã hủy" },
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Schedule Appointments Listing */}
                  {haircutScheduleBookings.length === 0 ? (
                    <Card className="rounded-2xl border-gray-100 shadow-sm py-16 text-center">
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <div className="space-y-1">
                            <p className="font-bold text-gray-700 text-sm mb-0">Không tìm thấy lịch cắt tóc nào phù hợp</p>
                            <p className="text-gray-400 text-xs">Vui lòng chọn ngày khác hoặc thay đổi bộ lọc ca làm việc</p>
                          </div>
                        }
                      >
                        <Button
                          size="small"
                          type="primary"
                          className="bg-blue-600 rounded-lg font-bold"
                          onClick={() => {
                            setScheduleDateMode("all");
                            setScheduleShiftFilter("ALL");
                            setScheduleStatusFilter("ALL");
                            setScheduleSearch("");
                            setScheduleCustomDate(null);
                          }}
                        >
                          Hiển thị toàn bộ lịch hẹn
                        </Button>
                      </Empty>
                    </Card>
                  ) : scheduleViewMode === "cards" ? (
                    /* DẠNG THẺ (CARD VIEW) */
                    <Row gutter={[16, 16]}>
                      {haircutScheduleBookings.map((b) => {
                        const shiftInfo = getShiftBadge(b.startTime);
                        const noteKey = b.id || b.bookingCode;
                        const stylistNote = stylistNotes[noteKey];

                        return (
                          <Col xs={24} md={12} xl={8} key={b.id || b.bookingCode}>
                            <Card
                              className={`rounded-2xl border transition-all hover:shadow-md ${
                                b.status === "IN_PROGRESS"
                                  ? "border-purple-300 ring-2 ring-purple-100 bg-purple-50/20"
                                  : "border-gray-100 bg-white"
                              }`}
                              bodyStyle={{ padding: "18px" }}
                            >
                              {/* Header Card */}
                              <div className="flex items-start justify-between mb-3 pb-2.5 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                    #{b.bookingCode || "BK"}
                                  </span>
                                  <Tag color={shiftInfo.color} className="text-[10px] font-bold px-1.5 py-0 leading-none">
                                    {shiftInfo.tag}
                                  </Tag>
                                </div>

                                {/* Status Tag */}
                                <Tag
                                  color={
                                    b.status === "PENDING"
                                      ? "gold"
                                      : b.status === "CONFIRMED"
                                      ? "processing"
                                      : b.status === "IN_PROGRESS"
                                      ? "purple"
                                      : b.status === "COMPLETED"
                                      ? "success"
                                      : "error"
                                  }
                                  className="font-bold text-xs rounded-full px-2"
                                >
                                  {b.status === "PENDING" && "Chờ xác nhận"}
                                  {b.status === "CONFIRMED" && "Đã nhận lịch"}
                                  {b.status === "IN_PROGRESS" && "⚡ Đang cắt tóc"}
                                  {b.status === "COMPLETED" && "Đã hoàn thành"}
                                  {b.status === "CANCELLED" && "Đã hủy"}
                                </Tag>
                              </div>

                              {/* Appointment Time Banner */}
                              <div className="bg-slate-50 p-3 rounded-xl mb-3 border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <ClockCircleOutlined className="text-blue-500 text-base" />
                                  <div>
                                    <span className="text-[11px] text-gray-400 block leading-tight">Thời gian hẹn</span>
                                    <span className="font-bold text-xs text-gray-800">
                                      {formatDateTime(b.startTime)}
                                    </span>
                                  </div>
                                </div>
                                <span className="font-bold text-sm text-blue-600">
                                  {formatCurrency(b.totalAmount)}
                                </span>
                              </div>

                              {/* Customer Information */}
                              <div className="flex items-center gap-3 mb-3">
                                <Avatar
                                  size={44}
                                  icon={<UserOutlined />}
                                  className="bg-slate-800 text-white flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="font-bold text-sm text-gray-900 truncate mb-0">
                                      {b.customerName || b.userName || "Khách hàng"}
                                    </p>
                                    <button
                                      onClick={() => handleOpenCustomerDetail(b)}
                                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5"
                                    >
                                      <EyeOutlined /> Chi tiết
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <a
                                      href={`tel:${b.customerPhone || b.userPhone}`}
                                      className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
                                    >
                                      <PhoneOutlined /> {b.customerPhone || b.userPhone || "Chưa có SĐT"}
                                    </a>
                                  </div>
                                </div>
                              </div>

                              {/* Service Name */}
                              <div className="bg-slate-50/60 p-2.5 rounded-xl border border-gray-100 text-xs mb-3 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500 font-medium">Dịch vụ đảm nhiệm:</span>
                                  <span className="font-bold text-gray-800">
                                    ✂️ {b.serviceName || "Gói cắt tóc VIP chuẩn Stylist"}
                                  </span>
                                </div>
                                {b.notes && (
                                  <div className="text-[11px] text-gray-600 italic bg-white p-1.5 rounded border border-gray-100">
                                    "💬 Khách yêu cầu: {b.notes}"
                                  </div>
                                )}
                              </div>

                              {/* Stylist Private Note Preview */}
                              {stylistNote && (
                                <div className="bg-amber-50/70 p-2 rounded-xl border border-amber-200 text-xs text-amber-900 mb-3 flex items-start gap-1.5">
                                  <span className="text-sm">📝</span>
                                  <div className="flex-1">
                                    <span className="font-bold text-[11px] text-amber-800 block">Ghi chú Stylist:</span>
                                    <span className="text-xs">{stylistNote}</span>
                                  </div>
                                </div>
                              )}

                              {/* Action Buttons Toolbar */}
                              <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5">
                                  <Button
                                    size="small"
                                    icon={<EditOutlined />}
                                    onClick={() => handleOpenStylistNote(b)}
                                    className="text-xs rounded-lg"
                                  >
                                    {stylistNote ? "Sửa ghi chú" : "Ghi chú"}
                                  </Button>

                                  {b.status !== "COMPLETED" && b.status !== "CANCELLED" && (
                                    <Popconfirm
                                      title="Xác nhận hủy lịch hẹn này?"
                                      description="Bạn có chắc chắn muốn hủy lịch hẹn của khách không?"
                                      okText="Đồng ý hủy"
                                      cancelText="Không"
                                      okButtonProps={{ danger: true }}
                                      onConfirm={() => handleStatusChange(b.id, "CANCELLED")}
                                    >
                                      <Button size="small" danger className="text-xs rounded-lg">
                                        Hủy
                                      </Button>
                                    </Popconfirm>
                                  )}
                                </div>

                                {/* Status progression button */}
                                <div>
                                  {b.status === "PENDING" && (
                                    <Button
                                      type="primary"
                                      size="small"
                                      icon={<CheckCircleOutlined />}
                                      onClick={() => handleStatusChange(b.id, "CONFIRMED")}
                                      className="bg-blue-600 font-bold rounded-lg text-xs"
                                    >
                                      Nhận lịch
                                    </Button>
                                  )}

                                  {b.status === "CONFIRMED" && (
                                    <Button
                                      type="primary"
                                      size="small"
                                      icon={<PlayCircleOutlined />}
                                      onClick={() => handleStatusChange(b.id, "IN_PROGRESS")}
                                      className="bg-purple-600 font-bold rounded-lg text-xs"
                                    >
                                      Bắt đầu cắt
                                    </Button>
                                  )}

                                  {b.status === "IN_PROGRESS" && (
                                    <Button
                                      type="primary"
                                      size="small"
                                      icon={<CheckCircleOutlined />}
                                      onClick={() => handleStatusChange(b.id, "COMPLETED")}
                                      className="bg-green-600 font-bold rounded-lg text-xs"
                                    >
                                      Hoàn thành cắt
                                    </Button>
                                  )}

                                  {b.status === "COMPLETED" && (
                                    <Tag color="success" className="font-bold text-xs py-0.5 px-2 rounded-lg">
                                      ✓ Đã hoàn tất
                                    </Tag>
                                  )}
                                </div>
                              </div>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                  ) : (
                    /* DẠNG BẢNG (TABLE VIEW) */
                    <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden p-0">
                      <Table
                        dataSource={haircutScheduleBookings}
                        rowKey={(r) => r.id || r.bookingCode}
                        pagination={{ pageSize: 10, showSizeChanger: true }}
                        columns={[
                          {
                            title: "Mã đặt lịch",
                            dataIndex: "bookingCode",
                            key: "bookingCode",
                            render: (v) => (
                              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                                #{v}
                              </span>
                            ),
                          },
                          {
                            title: "Thời gian hẹn",
                            dataIndex: "startTime",
                            key: "startTime",
                            render: (v) => (
                              <div>
                                <span className="font-bold text-xs text-gray-800 block">{formatDateTime(v)}</span>
                                <span className="text-[11px] text-gray-400">{getShiftBadge(v).tag}</span>
                              </div>
                            ),
                          },
                          {
                            title: "Khách hàng",
                            key: "customer",
                            render: (_, r) => (
                              <div>
                                <p className="font-bold text-xs text-gray-900 mb-0">{r.customerName || r.userName || "Khách hàng"}</p>
                                <a href={`tel:${r.customerPhone || r.userPhone}`} className="text-xs text-blue-600 hover:underline">
                                  📞 {r.customerPhone || r.userPhone || "—"}
                                </a>
                              </div>
                            ),
                          },
                          {
                            title: "Dịch vụ",
                            dataIndex: "serviceName",
                            key: "serviceName",
                            render: (v, r) => (
                              <div>
                                <span className="font-semibold text-xs text-gray-800 block">✂️ {v || "Cắt tóc VIP"}</span>
                                <span className="text-[11px] text-blue-600 font-bold">{formatCurrency(r.totalAmount)}</span>
                              </div>
                            ),
                          },
                          {
                            title: "Trạng thái",
                            dataIndex: "status",
                            key: "status",
                            render: (v) => {
                              const s = STATUS_LABELS[v] || { label: v, color: "default" };
                              return (
                                <Tag color={s.color} className="font-bold text-xs rounded-full px-2 py-0.5">
                                  {s.label}
                                </Tag>
                              );
                            },
                          },
                          {
                            title: "Ghi chú Stylist",
                            key: "stylistNote",
                            render: (_, r) => {
                              const note = stylistNotes[r.id || r.bookingCode];
                              return (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-gray-600 max-w-[150px] truncate">
                                    {note || <span className="text-gray-300 italic">Chưa có</span>}
                                  </span>
                                  <Button
                                    size="small"
                                    type="text"
                                    icon={<EditOutlined className="text-blue-500" />}
                                    onClick={() => handleOpenStylistNote(r)}
                                  />
                                </div>
                              );
                            },
                          },
                          {
                            title: "Thao tác",
                            key: "actions",
                            render: (_, r) => (
                              <div className="flex items-center gap-1.5">
                                {r.status === "PENDING" && (
                                  <Button
                                    size="small"
                                    type="primary"
                                    className="bg-blue-600 text-xs rounded-lg"
                                    onClick={() => handleStatusChange(r.id, "CONFIRMED")}
                                  >
                                    Nhận
                                  </Button>
                                )}
                                {r.status === "CONFIRMED" && (
                                  <Button
                                    size="small"
                                    type="primary"
                                    className="bg-purple-600 text-xs rounded-lg"
                                    onClick={() => handleStatusChange(r.id, "IN_PROGRESS")}
                                  >
                                    Bắt đầu
                                  </Button>
                                )}
                                {r.status === "IN_PROGRESS" && (
                                  <Button
                                    size="small"
                                    type="primary"
                                    className="bg-green-600 text-xs rounded-lg"
                                    onClick={() => handleStatusChange(r.id, "COMPLETED")}
                                  >
                                    Xong
                                  </Button>
                                )}
                                {r.status !== "COMPLETED" && r.status !== "CANCELLED" && (
                                  <Popconfirm
                                    title="Hủy lịch này?"
                                    onConfirm={() => handleStatusChange(r.id, "CANCELLED")}
                                    okText="Hủy"
                                    cancelText="Đóng"
                                  >
                                    <Button size="small" danger className="text-xs rounded-lg">
                                      Hủy
                                    </Button>
                                  </Popconfirm>
                                )}
                              </div>
                            ),
                          },
                        ]}
                      />
                    </Card>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════ */}
              {/* VIEW 2: FULL APPOINTMENTS TABLE                         */}
              {/* ═══════════════════════════════════════════════════════ */}
              {activeSection === "appointments" && (
                <Card className="rounded-2xl border-gray-100 shadow-sm">
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <Input
                        placeholder="Tìm mã lịch, tên khách hàng, SĐT..."
                        prefix={<SearchOutlined className="text-gray-400" />}
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        allowClear
                        className="w-full sm:w-72 rounded-xl"
                      />

                      <Select
                        value={filterStatus}
                        onChange={setFilterStatus}
                        className="w-44"
                      >
                        <Option value="ALL">Tất cả trạng thái</Option>
                        <Option value="PENDING">Chờ xác nhận</Option>
                        <Option value="CONFIRMED">Lịch cắt tóc</Option>
                        <Option value="COMPLETED">Đã hoàn thành</Option>
                        <Option value="CANCELLED">Đã hủy</Option>
                      </Select>
                    </div>

                    <span className="text-xs text-gray-500">
                      Hiển thị {filteredAppointments.length} lịch hẹn
                    </span>
                  </div>

                  <Table
                    dataSource={filteredAppointments}
                    rowKey={(r) => r.id || r.bookingCode}
                    pagination={{ pageSize: 8, showSizeChanger: true }}
                    columns={[
                      {
                        title: "Mã đặt lịch",
                        dataIndex: "bookingCode",
                        key: "bookingCode",
                        render: (v) => <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{v}</span>,
                      },
                      {
                        title: "Khách hàng",
                        dataIndex: "customerName",
                        key: "customerName",
                        render: (v, r) => (
                          <div>
                            <p className="font-bold text-xs text-gray-800 mb-0">{v || "Khách hàng"}</p>
                            <span className="text-[11px] text-gray-400">{r.customerPhone}</span>
                          </div>
                        ),
                      },
                      {
                        title: "Bắt đầu",
                        dataIndex: "startTime",
                        key: "startTime",
                        render: (v) => <span className="text-xs text-gray-600">{formatDateTime(v)}</span>,
                      },
                      {
                        title: "Tổng tiền",
                        dataIndex: "totalAmount",
                        key: "totalAmount",
                        render: (v) => <span className="font-bold text-xs text-amber-700">{formatCurrency(v)}</span>,
                      },
                      {
                        title: "Trạng thái",
                        dataIndex: "status",
                        key: "status",
                        render: (v) => {
                          const s = STATUS_TABS.find(t => t.key === v) || { label: v, color: "default" };
                          return <Tag color={s.color} className="text-xs font-bold">{s.label}</Tag>;
                        },
                      },
                      {
                        title: "Thao tác",
                        key: "actions",
                        render: (_, r) => (
                          <div className="flex gap-1.5">
                            {r.status === "PENDING" && (
                              <>
                                <Button
                                  size="small"
                                  type="primary"
                                  onClick={() => handleStatusChange(r.id, "CONFIRMED")}
                                  className="text-xs bg-blue-600 font-bold"
                                >
                                  Nhận
                                </Button>
                                <Button
                                  size="small"
                                  danger
                                  onClick={() => handleStatusChange(r.id, "CANCELLED")}
                                  className="text-xs"
                                >
                                  Hủy
                                </Button>
                              </>
                            )}
                            {r.status === "CONFIRMED" && (
                              <>
                                <Button
                                  size="small"
                                  type="primary"
                                  onClick={() => handleStatusChange(r.id, "COMPLETED")}
                                  className="text-xs bg-green-600 font-bold"
                                >
                                  Xong
                                </Button>
                                <Button
                                  size="small"
                                  danger
                                  onClick={() => handleStatusChange(r.id, "CANCELLED")}
                                  className="text-xs"
                                >
                                  Hủy
                                </Button>
                              </>
                            )}
                          </div>
                        ),
                      },
                    ]}
                  />
                </Card>
              )}

              {/* ═══════════════════════════════════════════════════════ */}
              {/* VIEW 3: ASSIGNED SERVICES                               */}
              {/* ═══════════════════════════════════════════════════════ */}
              {activeSection === "services" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-gray-800 mb-0">Dịch vụ bạn phụ trách</h2>
                      <p className="text-xs text-gray-400 mb-0">Khách hàng có thể chọn bạn cho các dịch vụ chuyên môn này</p>
                    </div>
                  </div>

                  <Row gutter={[16, 16]}>
                    {services.map((srv) => (
                      <Col key={srv.id} xs={24} sm={12} lg={8}>
                        <Card className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg shadow-sm">
                              <ScissorOutlined />
                            </div>
                            <span className="font-bold text-base text-amber-700">{formatCurrency(srv.price)}</span>
                          </div>

                          <h3 className="font-bold text-sm text-gray-800 mb-1">{srv.serviceName}</h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                            <span>⏱️ Thời gian thực hiện: <strong>{srv.duration || 45} phút</strong></span>
                          </div>

                          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                            <span className="text-gray-400">Chứng nhận tay nghề:</span>
                            <Tag color="success" className="text-[10px]">ĐÃ ĐẠT CHUẨN</Tag>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════ */}
              {/* VIEW 4: STYLIST PROFILE                                 */}
              {/* ═══════════════════════════════════════════════════════ */}
              {activeSection === "profile" && (
                <div className="max-w-4xl space-y-6">
                  <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden p-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-gray-100">
                      <Avatar
                        size={96}
                        src={profile?.avatarUrl || userInfo?.avatarUrl}
                        icon={<UserOutlined />}
                        className="border-4 border-amber-500 shadow-lg"
                      />
                      <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                          <h2 className="text-2xl font-black text-gray-900 mb-0">
                            {profile?.fullName || userInfo?.fullName}
                          </h2>
                          <Tag color="gold" className="font-bold text-xs uppercase self-center sm:self-auto">
                            {profile?.levelRank || "MASTER"} STYLIST
                          </Tag>
                        </div>
                        <p className="text-sm text-amber-600 font-semibold mb-2">@{profile?.nickname || "alex"}</p>
                        <p className="text-xs text-gray-600 italic max-w-xl">
                          "{profile?.bio || "Stylist chuyên nghiệp tận tâm với từng đường nét phong cách của quý khách."}"
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-6 text-xs text-gray-700">
                      <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 space-y-1">
                        <span className="text-gray-400">Chi nhánh công tác</span>
                        <p className="font-bold text-sm text-gray-800 mb-0">📍 {profile?.salonName || "Chi nhánh Cầu Giấy"}</p>
                        <span className="text-[11px] text-gray-500">{profile?.salonAddress}</span>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 space-y-1">
                        <span className="text-gray-400">Kinh nghiệm chuyên môn</span>
                        <p className="font-bold text-sm text-blue-700 mb-0">{profile?.experienceYears || 5} năm kinh nghiệm</p>
                        <span className="text-[11px] text-gray-500">Gia nhập: {profile?.joinDate || "2020-01-01"}</span>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 space-y-1">
                        <span className="text-gray-400">Hiệu suất phục vụ</span>
                        <p className="font-bold text-sm text-amber-600 mb-0">⭐ {Number(profile?.ratingAverage || 4.9).toFixed(1)} / 5.0</p>
                        <span className="text-[11px] text-gray-500">{profile?.totalServedBookings || 1000}+ khách hàng hài lòng</span>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 space-y-1">
                        <span className="text-gray-400">Lương cơ bản</span>
                        <p className="font-bold text-sm text-gray-800 mb-0">{formatCurrency(profile?.baseSalary || 12000000)}</p>
                        <span className="text-[11px] text-gray-500">Được chi trả đúng kỳ hạn</span>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 space-y-1">
                        <span className="text-gray-400">Tỉ lệ hoa hồng</span>
                        <p className="font-bold text-sm text-green-600 mb-0">+{profile?.commissionRate || 20}% mỗi dịch vụ</p>
                        <span className="text-[11px] text-gray-500">Tiền tip tích lũy: {formatCurrency(profile?.tipBalance || 500000)}</span>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 space-y-1">
                        <span className="text-gray-400">Ca làm việc</span>
                        <p className="font-bold text-sm text-purple-700 mb-0">{profile?.workShiftType || "FULL_TIME"}</p>
                        <span className="text-[11px] text-gray-500">Được bảo hiểm & quyền lợi đầy đủ</span>
                      </div>
                    </div>

                    {profile?.specialties && (
                      <div className="mt-6 pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-500 font-semibold block mb-2">Thế mạnh & Phong cách sở trường:</span>
                        <div className="flex flex-wrap gap-2">
                          {profile.specialties.split(",").map((tag, idx) => (
                            <Tag key={idx} color="purple" className="text-xs font-semibold py-0.5 px-2.5 rounded-lg">
                              ✨ {tag.trim()}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {/* Modal Ghi chú chuyên môn của Stylist */}
              <Modal
                title={
                  <div className="flex items-center gap-2 text-base font-bold text-gray-800">
                    <EditOutlined className="text-amber-500" />
                    <span>Ghi chú chuyên môn Stylist - Lịch hẹn #{selectedBookingForNote?.bookingCode || selectedBookingForNote?.id}</span>
                  </div>
                }
                open={stylistNoteModalOpen}
                onCancel={() => setStylistNoteModalOpen(false)}
                onOk={handleSaveStylistNote}
                okText="Lưu ghi chú"
                cancelText="Đóng"
                okButtonProps={{ className: "bg-blue-600 hover:bg-blue-700" }}
                destroyOnClose
              >
                {selectedBookingForNote && (
                  <div className="space-y-4 pt-2">
                    <div className="bg-slate-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-gray-400 block">Khách hàng</span>
                        <span className="font-bold text-gray-800">{selectedBookingForNote.customerName}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Số điện thoại</span>
                        <span className="font-semibold text-blue-600">{selectedBookingForNote.customerPhone || "Chưa có"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Thời gian</span>
                        <span className="font-semibold text-gray-700">{selectedBookingForNote.bookingTime} - {selectedBookingForNote.bookingDate}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Lưu ý kỹ thuật, kiểu mẫu & chất tóc của khách:
                      </label>
                      <Input.TextArea
                        rows={5}
                        placeholder="Ví dụ: Khách thích tỉa fade cao, mái phồng 7/3, da đầu nhạy cảm không dùng sáp cứng, lần tới muốn uốn texture..."
                        value={stylistNoteText}
                        onChange={(e) => setStylistNoteText(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                )}
              </Modal>

              {/* Modal Chi tiết Khách hàng & Lịch hẹn */}
              <Modal
                title={
                  <div className="flex items-center gap-2 text-base font-bold text-gray-800">
                    <UserOutlined className="text-blue-600" />
                    <span>Hồ sơ Lịch hẹn #{selectedCustomerBooking?.bookingCode || selectedCustomerBooking?.id}</span>
                  </div>
                }
                open={customerModalOpen}
                onCancel={() => setCustomerModalOpen(false)}
                footer={[
                  <Button key="close" onClick={() => setCustomerModalOpen(false)} className="rounded-lg">
                    Đóng
                  </Button>,
                  <Button
                    key="note"
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setCustomerModalOpen(false);
                      if (selectedCustomerBooking) handleOpenStylistNote(selectedCustomerBooking);
                    }}
                    className="rounded-lg bg-amber-500 hover:bg-amber-600 border-none"
                  >
                    Viết ghi chú
                  </Button>,
                ]}
                destroyOnClose
              >
                {selectedCustomerBooking && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-3 p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                      <Avatar size={48} className="bg-blue-600 text-white font-black text-lg">
                        {selectedCustomerBooking.customerName ? selectedCustomerBooking.customerName.charAt(0).toUpperCase() : "K"}
                      </Avatar>
                      <div>
                        <h4 className="font-bold text-gray-900 text-base mb-0">{selectedCustomerBooking.customerName}</h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span>📞 {selectedCustomerBooking.customerPhone || "Chưa có SĐT"}</span>
                          <span>📧 {selectedCustomerBooking.customerEmail || "Chưa có email"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-gray-100">
                        <span className="text-gray-400 block mb-0.5">Ngày hẹn</span>
                        <span className="font-bold text-gray-800">{selectedCustomerBooking.bookingDate}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-gray-100">
                        <span className="text-gray-400 block mb-0.5">Giờ cắt & Ca</span>
                        <span className="font-bold text-blue-600">{selectedCustomerBooking.bookingTime} ({selectedCustomerBooking.shiftCategory || "Sáng"})</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-gray-100">
                        <span className="text-gray-400 block mb-0.5">Dịch vụ sử dụng</span>
                        <span className="font-bold text-purple-700">{selectedCustomerBooking.serviceName || "Cắt tóc"}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-gray-100">
                        <span className="text-gray-400 block mb-0.5">Tổng thanh toán</span>
                        <span className="font-bold text-emerald-600">{formatCurrency(selectedCustomerBooking.totalPrice || selectedCustomerBooking.servicePrice || 0)}</span>
                      </div>
                    </div>

                    {selectedCustomerBooking.notes && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs">
                        <span className="font-bold text-amber-800 block mb-1">📝 Ghi chú từ khách:</span>
                        <p className="text-amber-900 mb-0 italic">"{selectedCustomerBooking.notes}"</p>
                      </div>
                    )}

                    {stylistNotes[selectedCustomerBooking.id || selectedCustomerBooking.bookingCode] && (
                      <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-xs">
                        <span className="font-bold text-blue-800 block mb-1">✂️ Ghi chú của Stylist:</span>
                        <p className="text-blue-900 mb-0 italic">
                          "{stylistNotes[selectedCustomerBooking.id || selectedCustomerBooking.bookingCode]}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Modal>
            </>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}
