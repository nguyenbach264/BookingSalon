import React, { useState, useMemo } from "react";
import {
  Calendar,
  Badge,
  Card,
  Tag,
  Drawer,
  Button,
  Empty,
  Row,
  Col,
  Tooltip,
} from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  ScissorOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/vi";

dayjs.locale("vi");

const parseToDate = (dt) => {
  if (!dt) return null;
  if (Array.isArray(dt)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = dt;
    return new Date(year, month - 1, day, hour, minute, second);
  }
  const d = new Date(dt);
  return isNaN(d.getTime()) ? null : d;
};

const formatDateYMD = (dt) => {
  const d = parseToDate(dt);
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const STATUS_CONFIG = {
  PENDING: { label: "Chờ xác nhận", color: "#f59e0b", badgeStatus: "warning", tagColor: "gold" },
  CONFIRMED: { label: "Đã nhận lịch", color: "#2563eb", badgeStatus: "processing", tagColor: "blue" },
  IN_PROGRESS: { label: "Đang cắt", color: "#7c3aed", badgeStatus: "purple", tagColor: "purple" },
  COMPLETED: { label: "Đã hoàn thành", color: "#10b981", badgeStatus: "success", tagColor: "green" },
  CANCELLED: { label: "Đã hủy", color: "#ef4444", badgeStatus: "error", tagColor: "default" },
};

export default function StylistHaircutSchedule({
  allBookings = [],
  haircutScheduleBookings = [],
  formatCurrency,
  formatDateTime,
}) {
  // Use all bookings so the calendar shows the full schedule across months
  const bookings = allBookings.length > 0 ? allBookings : haircutScheduleBookings;

  const [selectedDayjs, setSelectedDayjs] = useState(() => dayjs());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState(null);

  // Group bookings by date: { "2026-09-29": [booking1, booking2] }
  const bookingsByDate = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      if (!b.startTime) return;
      const key = formatDateYMD(b.startTime);
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });

    // Sort bookings on each day chronologically
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => {
        const da = parseToDate(a.startTime);
        const db = parseToDate(b.startTime);
        return (da ? da.getTime() : 0) - (db ? db.getTime() : 0);
      });
    });

    return map;
  }, [bookings]);

  // Bookings on the selected date
  const selectedDateKey = selectedDayjs.format("YYYY-MM-DD");
  const selectedDateBookings = bookingsByDate[selectedDateKey] || [];

  // Summary KPIs for the current month
  const currentMonthKey = selectedDayjs.format("YYYY-MM");
  const monthBookings = useMemo(() => {
    return bookings.filter((b) => {
      const key = formatDateYMD(b.startTime);
      return key.startsWith(currentMonthKey);
    });
  }, [bookings, currentMonthKey]);

  const monthStats = useMemo(() => {
    const total = monthBookings.length;
    const confirmed = monthBookings.filter((b) => b.status === "CONFIRMED").length;
    const completed = monthBookings.filter((b) => b.status === "COMPLETED").length;
    const pending = monthBookings.filter((b) => b.status === "PENDING").length;
    const cancelled = monthBookings.filter((b) => b.status === "CANCELLED").length;
    return { total, confirmed, completed, pending, cancelled };
  }, [monthBookings]);

  // Custom Calendar Cell Render
  const dateCellRender = (value) => {
    const key = value.format("YYYY-MM-DD");
    const list = bookingsByDate[key] || [];
    if (list.length === 0) return null;

    return (
      <div className="space-y-1 mt-1">
        {list.slice(0, 3).map((item) => {
          const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
          const dt = parseToDate(item.startTime);
          const timeStr = dt
            ? `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`
            : "";

          return (
            <Tooltip
              key={item.id || item.bookingCode}
              title={`${timeStr} - ${item.customerName || "Khách"} (${cfg.label})`}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedBookingForDetail(item);
                  setDrawerOpen(true);
                }}
                className="text-[11px] px-1.5 py-0.5 rounded truncate font-medium flex items-center gap-1 cursor-pointer transition-transform hover:scale-[1.02]"
                style={{
                  backgroundColor: `${cfg.color}15`,
                  color: cfg.color,
                  borderLeft: `3px solid ${cfg.color}`,
                }}
              >
                <span className="font-bold">{timeStr}</span>
                <span className="truncate">{item.customerName || "Khách"}</span>
              </div>
            </Tooltip>
          );
        })}
        {list.length > 3 && (
          <div className="text-[10px] text-gray-500 font-semibold px-1">
            +{list.length - 3} lịch nữa
          </div>
        )}
      </div>
    );
  };

  const handleSelectDate = (date) => {
    setSelectedDayjs(date);
  };

  const formatPrice = (p) => {
    if (formatCurrency) return formatCurrency(p);
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p || 0);
  };

  const formatTimeSlot = (dt) => {
    const d = parseToDate(dt);
    if (!d) return "—";
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-gray-900 mb-1 flex items-center gap-2">
            <CalendarOutlined className="text-blue-600 text-xl" />
            Lịch Cắt Tóc (Calendar)
          </h2>
          <p className="text-xs text-gray-500 mb-0">
            Theo dõi trực quan toàn bộ các ca cắt tóc theo lịch biểu tháng. Nhấp vào ngày để xem chi tiết lịch hẹn.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1 font-semibold text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Chờ xác nhận
          </span>
          <span className="flex items-center gap-1 font-semibold text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span> Đã nhận lịch
          </span>
          <span className="flex items-center gap-1 font-semibold text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span> Đang cắt
          </span>
          <span className="flex items-center gap-1 font-semibold text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Hoàn thành
          </span>
          <span className="flex items-center gap-1 font-semibold text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span> Đã hủy
          </span>
        </div>
      </div>

      {/* Quick Month Metrics */}
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={6} md={4}>
          <Card className="rounded-2xl border-gray-100 shadow-xs p-3 text-center bg-slate-50/70">
            <span className="text-[11px] font-bold uppercase text-gray-500">Tổng lịch tháng</span>
            <div className="text-2xl font-black text-gray-800 mt-1">{monthStats.total}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={5}>
          <Card className="rounded-2xl border-gray-100 shadow-xs p-3 text-center bg-blue-50/60">
            <span className="text-[11px] font-bold uppercase text-blue-700">Đã nhận lịch</span>
            <div className="text-2xl font-black text-blue-900 mt-1">{monthStats.confirmed}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={5}>
          <Card className="rounded-2xl border-gray-100 shadow-xs p-3 text-center bg-amber-50/60">
            <span className="text-[11px] font-bold uppercase text-amber-700">Chờ xác nhận</span>
            <div className="text-2xl font-black text-amber-900 mt-1">{monthStats.pending}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={5}>
          <Card className="rounded-2xl border-gray-100 shadow-xs p-3 text-center bg-emerald-50/60">
            <span className="text-[11px] font-bold uppercase text-emerald-700">Đã hoàn thành</span>
            <div className="text-2xl font-black text-emerald-900 mt-1">{monthStats.completed}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={5}>
          <Card className="rounded-2xl border-gray-100 shadow-xs p-3 text-center bg-red-50/60">
            <span className="text-[11px] font-bold uppercase text-red-700">Đã hủy</span>
            <div className="text-2xl font-black text-red-900 mt-1">{monthStats.cancelled}</div>
          </Card>
        </Col>
      </Row>

      {/* Main Calendar Card */}
      <Card className="rounded-2xl border-gray-100 shadow-xs p-2 sm:p-4 bg-white overflow-hidden">
        <Calendar
          value={selectedDayjs}
          onSelect={handleSelectDate}
          cellRender={(current, info) => {
            if (info.type === "date") return dateCellRender(current);
            return info.originNode;
          }}
        />
      </Card>

      {/* Selected Date Appointments Section */}
      <Card className="rounded-2xl border-gray-100 shadow-xs bg-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-4 border-b border-gray-100 gap-2">
          <div>
            <h3 className="font-bold text-gray-900 text-base mb-0.5 flex items-center gap-2">
              <ClockCircleOutlined className="text-blue-600" />
              Lịch cắt tóc ngày: <span className="text-blue-700">{selectedDayjs.format("DD/MM/YYYY")}</span>
            </h3>
            <span className="text-xs text-gray-400">
              {selectedDateBookings.length} lượt hẹn trong ngày này
            </span>
          </div>
        </div>

        {selectedDateBookings.length === 0 ? (
          <Empty
            description={`Không có lịch cắt tóc nào trong ngày ${selectedDayjs.format("DD/MM/YYYY")}`}
            className="py-8"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedDateBookings.map((b) => {
              const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.PENDING;
              return (
                <div
                  key={b.id || b.bookingCode}
                  onClick={() => {
                    setSelectedBookingForDetail(b);
                    setDrawerOpen(true);
                  }}
                  className="p-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer bg-slate-50/50 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        #{b.bookingCode || "BB-2026"}
                      </span>
                      <Tag color={cfg.tagColor} className="rounded-full text-[11px] font-bold border-none">
                        {cfg.label}
                      </Tag>
                    </div>

                    <p className="font-bold text-gray-900 text-sm mb-1 flex items-center gap-1.5">
                      <UserOutlined className="text-gray-400 text-xs" />
                      {b.customerName || "Khách hàng"}
                    </p>

                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                      <PhoneOutlined className="text-gray-400 text-xs" />
                      {b.customerPhone || "—"}
                    </p>

                    <div className="text-xs text-gray-700 space-y-1 mb-3">
                      <div className="flex items-center gap-1.5">
                        <ClockCircleOutlined className="text-blue-500 text-xs" />
                        <span>Giờ hẹn:</span>
                        <strong className="text-blue-900 font-bold">{formatTimeSlot(b.startTime)}</strong>
                      </div>
                      {b.salonName && (
                        <div className="flex items-center gap-1.5 truncate">
                          <EnvironmentOutlined className="text-gray-400 text-xs shrink-0" />
                          <span className="text-gray-600 truncate">{b.salonName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200/70 flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-700 text-sm">
                      {formatPrice(b.totalAmount)}
                    </span>
                    <Button
                      size="small"
                      type="link"
                      icon={<EyeOutlined />}
                      className="text-blue-600 font-semibold p-0 text-xs"
                    >
                      Chi tiết
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Appointment Detail Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <ScissorOutlined className="text-blue-600" />
            <span>Chi tiết Lịch hẹn #{selectedBookingForDetail?.bookingCode}</span>
          </div>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={420}
      >
        {selectedBookingForDetail && (
          <div className="space-y-4 text-sm text-gray-700">
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500 block">Trạng thái</span>
                <span className="font-bold text-sm text-gray-900">
                  {STATUS_CONFIG[selectedBookingForDetail.status]?.label || selectedBookingForDetail.status}
                </span>
              </div>
              <Tag
                color={STATUS_CONFIG[selectedBookingForDetail.status]?.tagColor}
                className="rounded-full font-bold px-3 py-1"
              >
                {STATUS_CONFIG[selectedBookingForDetail.status]?.label}
              </Tag>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase text-gray-400 tracking-wider">Khách hàng</h4>
              <p className="font-bold text-gray-900 text-base mb-0">
                {selectedBookingForDetail.customerName || "Khách hàng"}
              </p>
              <p className="text-xs text-gray-600 mb-0">
                📞 SĐT: <strong>{selectedBookingForDetail.customerPhone || "—"}</strong>
              </p>
              {selectedBookingForDetail.customerEmail && (
                <p className="text-xs text-gray-600 mb-0">
                  ✉️ Email: {selectedBookingForDetail.customerEmail}
                </p>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100">
              <h4 className="font-bold text-xs uppercase text-gray-400 tracking-wider">Thời gian & Salon</h4>
              <p className="text-xs text-gray-700 mb-1">
                📅 Ngày hẹn: <strong>{formatDateYMD(selectedBookingForDetail.startTime)}</strong>
              </p>
              <p className="text-xs text-gray-700 mb-1">
                ⏰ Giờ bắt đầu: <strong>{formatTimeSlot(selectedBookingForDetail.startTime)}</strong>
              </p>
              <p className="text-xs text-gray-700 mb-1">
                📍 Salon: <strong>{selectedBookingForDetail.salonName || "Salon"}</strong>
              </p>
              {selectedBookingForDetail.salonAddress && (
                <p className="text-xs text-gray-500 mb-0">
                  Địa chỉ: {selectedBookingForDetail.salonAddress}
                </p>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100">
              <h4 className="font-bold text-xs uppercase text-gray-400 tracking-wider">Chi phí & Thanh toán</h4>
              <div className="flex justify-between items-center text-sm">
                <span>Tổng chi phí:</span>
                <span className="font-black text-blue-600 text-base">
                  {formatPrice(selectedBookingForDetail.totalAmount)}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Phương thức: {selectedBookingForDetail.paymentMethod === "BANK_TRANSFER" ? "Chuyển khoản QR" : "Tiền mặt"}
              </p>
            </div>

            {selectedBookingForDetail.customerNotes && (
              <div className="pt-2 border-t border-gray-100">
                <h4 className="font-bold text-xs uppercase text-gray-400 tracking-wider">Ghi chú của khách</h4>
                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 mt-1">
                  {selectedBookingForDetail.customerNotes}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
