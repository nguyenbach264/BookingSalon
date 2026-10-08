import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Layout,
  Menu,
  Avatar,
  Tag,
  Card,
  Spin,
  Switch,
  Button,
  Modal,
  Input,
  Drawer,
  message,
  Tooltip,
} from "antd";
import {
  CalendarOutlined,
  UserOutlined,
  BarChartOutlined,
  LogoutOutlined,
  ScissorOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  CheckOutlined,
  PlayCircleOutlined,
  MenuOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../auth/authProvider";
import { useNavigate } from "react-router-dom";
import notificationWs from "../../service/websocket/notificationWebSocket";
import {
  getStylistStatistics,
  getBookingsByStylist,
} from "../../service/api/bookingApi";
import { getStylistById, getStylistServices, updateBookingStatus, updateStylistDutyStatus } from "../../service/api/adminApi";

import StylistOverview from "./views/StylistOverview";
import StylistHaircutSchedule from "./views/StylistHaircutSchedule";
import StylistAppointments from "./views/StylistAppointments";
import StylistServices from "./views/StylistServices";
import StylistProfile from "./views/StylistProfile";

const { Header, Sider, Content } = Layout;

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
    icon: <ClockCircleOutlined />,
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filter for appointment management view
  const [filterSearch, setFilterSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Duty status & Cooldown management (Requirement 4)
  const [dutyLoading, setDutyLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (profile?.cooldownRemainingSeconds !== undefined && profile?.cooldownRemainingSeconds !== null) {
      setCooldownSeconds(Math.max(0, Number(profile.cooldownRemainingSeconds) || 0));
    } else if (profile?.nextAvailableOnTime) {
      const diff = Math.max(0, Math.floor((new Date(profile.nextAvailableOnTime).getTime() - Date.now()) / 1000));
      setCooldownSeconds(diff);
    } else {
      setCooldownSeconds(0);
    }
  }, [profile]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const formatCooldown = (seconds) => {
    if (seconds <= 0) return "";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const isDutyActive = profile?.status === "ACTIVE" || profile?.isDutyActive === true;
  const isCoolingDown = cooldownSeconds > 0 && !isDutyActive;

  const handleToggleDuty = async (checked) => {
    if (!checked) {
      Modal.confirm({
        title: "Tắt trạng thái hoạt động?",
        content: "Lưu ý: Khi tắt hoạt động, tên của bạn sẽ tạm thời ẩn khỏi danh sách đặt hẹn của khách hàng và bạn phải đợi 2 tiếng mới có thể bật lại chế độ nhận khách!",
        okText: "Xác nhận tắt (Nghỉ 2 tiếng)",
        cancelText: "Hủy bỏ",
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            setDutyLoading(true);
            const res = await updateStylistDutyStatus(stylistId, false);
            setProfile(res);
            message.info("Đã tắt trạng thái hoạt động. Bắt đầu đếm ngược thời gian chờ 2 tiếng.");
          } catch (err) {
            message.error(err?.response?.data?.message || "Không thể cập nhật trạng thái!");
          } finally {
            setDutyLoading(false);
          }
        },
      });
    } else {
      if (cooldownSeconds > 0) {
        message.warning(`Bạn đang trong thời gian nghỉ. Vui lòng đợi hết ${formatCooldown(cooldownSeconds)} để bật lại!`);
        return;
      }
      try {
        setDutyLoading(true);
        const res = await updateStylistDutyStatus(stylistId, true);
        setProfile(res);
        message.success("Đã bật chế độ Hoạt động - Sẵn sàng nhận khách đặt lịch!");
      } catch (err) {
        message.error(err?.response?.data?.message || "Không thể bật trạng thái hoạt động!");
      } finally {
        setDutyLoading(false);
      }
    }
  };

  const [currentTime, setCurrentTime] = useState(() => new Date().toLocaleTimeString("vi-VN"));
  const [statsPeriod, setStatsPeriod] = useState("week");
  const [periodSearch, setPeriodSearch] = useState("");
  const [periodStatusFilter, setPeriodStatusFilter] = useState("ALL");
  const [showPeriodTable, setShowPeriodTable] = useState(true);

  // Haircut schedule state
  const [scheduleDateMode, setScheduleDateMode] = useState("today");
  const [scheduleCustomDate, setScheduleCustomDate] = useState(null);
  const [scheduleShiftFilter, setScheduleShiftFilter] = useState("ALL");
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState("ALL");
  const [scheduleSearch, setScheduleSearch] = useState("");
  const [scheduleViewMode, setScheduleViewMode] = useState("cards");

  // Stylist private notes
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

  // Customer modal
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

  // Real-time WebSocket connection
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
      case "day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week": {
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startDate = new Date(now.getFullYear(), now.getMonth(), diff);
        break;
      }
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
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

    const completed = periodBookings.filter(b => b.status === "COMPLETED");
    const cancelled = periodBookings.filter(b => b.status === "CANCELLED");
    const pending = periodBookings.filter(b => b.status === "PENDING");
    const confirmed = periodBookings.filter(b => b.status === "CONFIRMED" || b.status === "IN_PROGRESS");

    const revenue = completed.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
    const completionRate = periodBookings.length > 0 ? Math.round((completed.length / periodBookings.length) * 100) : 0;
    const avgRevenue = completed.length > 0 ? Math.round(revenue / completed.length) : 0;

    const chartData = [];
    if (statsPeriod === "day") {
      for (let h = 0; h < 24; h++) {
        const hourBookings = periodBookings.filter(b => {
          const d = Array.isArray(b.startTime) ? new Date(...b.startTime) : new Date(b.startTime);
          return d.getHours() === h;
        });
        chartData.push({ label: `${h}h`, count: hourBookings.length, revenue: hourBookings.filter(b => b.status === "COMPLETED").reduce((s, b) => s + (Number(b.totalAmount) || 0), 0) });
      }
    } else if (statsPeriod === "week") {
      const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + d);
        const dayStr = dayDate.toISOString().slice(0, 10);
        const dayBooks = allStylistBookings.filter(b => {
          if (!b.startTime) return false;
          const bd = Array.isArray(b.startTime) ? new Date(...b.startTime) : new Date(b.startTime);
          return bd.toISOString().slice(0, 10) === dayStr;
        });
        chartData.push({ label: weekDays[d], count: dayBooks.length, revenue: dayBooks.filter(b => b.status === "COMPLETED").reduce((s, b) => s + (Number(b.totalAmount) || 0), 0) });
      }
    } else if (statsPeriod === "month") {
      for (let w = 0; w < 5; w++) {
        const wStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1 + w * 7);
        const wEnd = new Date(startDate.getFullYear(), startDate.getMonth(), Math.min(7 + w * 7, new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate()));
        const wBooks = allStylistBookings.filter(b => {
          if (!b.startTime) return false;
          const bd = Array.isArray(b.startTime) ? new Date(...b.startTime) : new Date(b.startTime);
          return bd >= wStart && bd <= wEnd && bd.getMonth() === startDate.getMonth();
        });
        if (wStart.getDate() <= new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate())
          chartData.push({ label: `Tuần ${w+1}`, count: wBooks.length, revenue: wBooks.filter(b => b.status === "COMPLETED").reduce((s, b) => s + (Number(b.totalAmount) || 0), 0) });
      }
    } else {
      const months = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];
      for (let m = 0; m < 12; m++) {
        const mBooks = allStylistBookings.filter(b => {
          if (!b.startTime) return false;
          const bd = Array.isArray(b.startTime) ? new Date(...b.startTime) : new Date(b.startTime);
          return bd.getFullYear() === now.getFullYear() && bd.getMonth() === m;
        });
        chartData.push({ label: months[m], count: mBooks.length, revenue: mBooks.filter(b => b.status === "COMPLETED").reduce((s, b) => s + (Number(b.totalAmount) || 0), 0) });
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
    if (periodStatusFilter !== "ALL") {
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

  // Shift classification
  const getShiftBadge = (startTime) => {
    if (!startTime) return { label: "Chưa xác định", color: "default", tag: "Ca linh hoạt" };
    const d = Array.isArray(startTime) ? new Date(...startTime) : new Date(startTime);
    const h = d.getHours();
    if (h >= 8 && h < 12) return { label: "Ca Sáng (08:00 - 12:00)", color: "blue", tag: "Ca Sáng" };
    if (h >= 12 && h < 17) return { label: "Ca Chiều (12:00 - 17:00)", color: "orange", tag: "Ca Chiều" };
    return { label: "Ca Tối (17:00 - 21:00)", color: "purple", tag: "Ca Tối" };
  };

  // Haircut schedule bookings
  const haircutScheduleBookings = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

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
      const bDateStr = `${bDate.getFullYear()}-${String(bDate.getMonth() + 1).padStart(2, "0")}-${String(bDate.getDate()).padStart(2, "0")}`;
      const hour = bDate.getHours();

      if (scheduleDateMode === "today" && bDateStr !== todayStr) return false;
      if (scheduleDateMode === "tomorrow" && bDateStr !== tomorrowStr) return false;
      if (scheduleDateMode === "week" && (bDate < monday || bDate > sunday)) return false;
      if (scheduleDateMode === "custom" && scheduleCustomDate) {
        const customStr = typeof scheduleCustomDate === "string"
          ? scheduleCustomDate
          : scheduleCustomDate.format ? scheduleCustomDate.format("YYYY-MM-DD")
          : new Date(scheduleCustomDate).toISOString().slice(0, 10);
        if (bDateStr !== customStr) return false;
      }

      if (scheduleShiftFilter === "MORNING" && (hour < 8 || hour >= 12)) return false;
      if (scheduleShiftFilter === "AFTERNOON" && (hour < 12 || hour >= 17)) return false;
      if (scheduleShiftFilter === "EVENING" && (hour < 17 || hour >= 22)) return false;

      if (scheduleStatusFilter !== "ALL" && b.status !== scheduleStatusFilter) return false;

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
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const todayBookings = allStylistBookings.filter(b => {
      if (!b.startTime) return false;
      const bd = Array.isArray(b.startTime) ? new Date(...b.startTime) : new Date(b.startTime);
      const bdStr = `${bd.getFullYear()}-${String(bd.getMonth() + 1).padStart(2, "0")}-${String(bd.getDate()).padStart(2, "0")}`;
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

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100 flex-wrap">
          {b.status === "PENDING" && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleStatusChange(b.id, "CONFIRMED")}
                className="bg-blue-600 font-bold rounded-lg"
              >
                Nhận lịch này
              </Button>
              <Button
                size="small"
                danger
                onClick={() => handleStatusChange(b.id, "CANCELLED")}
                className="rounded-lg"
              >
                Hủy lịch
              </Button>
            </>
          )}

          {b.status === "CONFIRMED" && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleStatusChange(b.id, "COMPLETED")}
              className="bg-emerald-600 font-bold rounded-lg"
            >
              Đã hoàn thành
            </Button>
          )}

          {b.status === "IN_PROGRESS" && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleStatusChange(b.id, "COMPLETED")}
              className="bg-emerald-600 font-bold rounded-lg"
            >
              Đã hoàn thành
            </Button>
          )}
        </div>
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex flex-col items-center py-6 px-4 border-b border-gray-100 bg-white">
        <div className="w-12 h-12 bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl flex items-center justify-center mb-2.5 shadow-md">
          <ScissorOutlined className="text-white text-2xl" />
        </div>
        <span className="text-slate-900 font-black text-sm tracking-widest uppercase">
          STYLIST PORTAL
        </span>
        <span className="text-gray-400 text-xs font-semibold">BachBarber Pro Staff</span>
      </div>

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

      {/* Main Content Layout */}
      <Layout>
        {/* Header */}
        <Header className="bg-white/85 backdrop-blur-md px-4 sm:px-6 md:px-8 flex items-center justify-between shadow-xs border-b border-gray-100 h-16 sticky top-0 z-30">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              type="text"
              icon={<MenuOutlined />}
              className="lg:hidden text-lg"
              onClick={() => setMobileOpen(true)}
            />
            <h1 className="text-sm sm:text-base font-bold text-gray-800 mb-0 truncate max-w-[180px] sm:max-w-none">
              Xin chào,{" "}
              <span className="text-blue-600 font-black">
                {profile?.fullName || userInfo?.fullName || userInfo?.username}
              </span>{" "}
              👋
            </h1>
            <Tag color="gold" className="text-xs hidden md:inline-flex font-semibold">
              📍 {profile?.salonName || "Hệ thống BachBarber"}
            </Tag>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Live Clock */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-500 font-mono bg-slate-50 px-3 py-1 rounded-lg border border-gray-100">
              <ClockCircleOutlined className="text-blue-500" />
              <span>{currentTime}</span>
            </div>

            {/* Duty Switch with 2h Cooldown (Requirement 4) */}
            <div className="flex items-center gap-2">
              <Tooltip
                title={
                  isCoolingDown
                    ? `Đang trong thời gian nghỉ. Có thể bật lại sau: ${formatCooldown(cooldownSeconds)}`
                    : isDutyActive
                    ? "Đang sẵn sàng nhận khách đặt lịch. Bấm để tắt (nghỉ 2 tiếng)"
                    : "Đang tắt hoạt động. Bấm để bật sẵn sàng nhận khách"
                }
              >
                <div className="flex items-center gap-2 bg-slate-50 border border-gray-200/80 px-2.5 sm:px-3 py-1.5 rounded-xl shadow-xs">
                  <span className="text-xs font-bold text-gray-700 hidden sm:inline">Hoạt động:</span>
                  <Switch
                    checked={isDutyActive}
                    loading={dutyLoading}
                    disabled={isCoolingDown || dutyLoading}
                    onChange={handleToggleDuty}
                    checkedChildren="BẬT"
                    unCheckedChildren="TẮT"
                    className={isDutyActive ? "bg-emerald-600" : "bg-gray-400"}
                  />
                  {isCoolingDown && (
                    <Tag color="error" className="font-mono text-[11px] font-bold m-0 px-2 py-0.5 rounded-lg animate-pulse">
                      ⏳ Nghỉ: {formatCooldown(cooldownSeconds)}
                    </Tag>
                  )}
                  {isDutyActive && (
                    <Tag color="success" className="text-[11px] font-bold m-0 px-2 py-0.5 rounded-lg hidden sm:inline-flex">
                      🟢 Nhận khách
                    </Tag>
                  )}
                  {!isDutyActive && !isCoolingDown && (
                    <Tag color="default" className="text-[11px] font-bold m-0 px-2 py-0.5 rounded-lg text-gray-400 hidden sm:inline-flex">
                      ⚪ Tạm tắt
                    </Tag>
                  )}
                </div>
              </Tooltip>
            </div>

            {/* Live Sync Badge */}
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

        <Content className="p-4 sm:p-6 md:p-8 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-32">
              <Spin size="large" tip="Đang tải dữ liệu stylist..." />
            </div>
          ) : (
            <>
              {activeSection === "dashboard" && (
                <StylistOverview
                  pendingCount={pendingCount}
                  confirmedCount={confirmedCount}
                  completedCount={completedCount}
                  cancelledCount={cancelledCount}
                  totalCount={totalCount}
                  profile={profile}
                  statsPeriod={statsPeriod}
                  setStatsPeriod={setStatsPeriod}
                  periodMetrics={periodMetrics}
                  filteredPeriodBookings={filteredPeriodBookings}
                  showPeriodTable={showPeriodTable}
                  setShowPeriodTable={setShowPeriodTable}
                  periodSearch={periodSearch}
                  setPeriodSearch={setPeriodSearch}
                  periodStatusFilter={periodStatusFilter}
                  setPeriodStatusFilter={setPeriodStatusFilter}
                  formatCurrency={formatCurrency}
                  formatDateTime={formatDateTime}
                  handleStatusChange={handleStatusChange}
                  statusDistribution={statusDistribution}
                  topServicesData={topServicesData}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  STATUS_TABS={STATUS_TABS}
                  allStylistBookings={allStylistBookings}
                  renderBookingCard={renderBookingCard}
                />
              )}

              {activeSection === "haircut_schedule" && (
                <StylistHaircutSchedule
                  allBookings={allStylistBookings}
                  haircutScheduleBookings={haircutScheduleBookings}
                  formatCurrency={formatCurrency}
                  formatDateTime={formatDateTime}
                />
              )}

              {activeSection === "appointments" && (
                <StylistAppointments
                  allBookings={allStylistBookings}
                  filteredAppointments={filteredAppointments}
                  filterSearch={filterSearch}
                  setFilterSearch={setFilterSearch}
                  filterStatus={filterStatus}
                  setFilterStatus={setFilterStatus}
                  formatDateTime={formatDateTime}
                  formatCurrency={formatCurrency}
                  STATUS_TABS={STATUS_TABS}
                  handleStatusChange={handleStatusChange}
                />
              )}

              {activeSection === "services" && (
                <StylistServices
                  services={services}
                  formatCurrency={formatCurrency}
                />
              )}

              {activeSection === "profile" && (
                <StylistProfile
                  profile={profile}
                  userInfo={userInfo}
                  formatCurrency={formatCurrency}
                />
              )}

              {/* Modal Ghi chú chuyên môn Stylist */}
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
                style={{ maxWidth: "95vw" }}
              >
                {selectedBookingForNote && (
                  <div className="space-y-4 pt-2">
                    <div className="bg-slate-50 p-3 rounded-xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
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
                        placeholder="Ví dụ: Khách thích tỉa fade cao, mái phồng 7/3, da đầu nhạy cảm không dùng sáp cứng..."
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
                style={{ maxWidth: "95vw" }}
              >
                {selectedCustomerBooking && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-3 p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                      <Avatar size={48} className="bg-blue-600 text-white font-black text-lg">
                        {selectedCustomerBooking.customerName ? selectedCustomerBooking.customerName.charAt(0).toUpperCase() : "K"}
                      </Avatar>
                      <div>
                        <h4 className="font-bold text-gray-900 text-base mb-0">{selectedCustomerBooking.customerName}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                          <span>📞 {selectedCustomerBooking.customerPhone || "Chưa có SĐT"}</span>
                          <span>📧 {selectedCustomerBooking.customerEmail || "Chưa có email"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
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
