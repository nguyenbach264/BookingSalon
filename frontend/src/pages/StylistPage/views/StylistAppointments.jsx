import React, { useState, useMemo } from "react";
import {
  Card,
  Input,
  Select,
  Table,
  Tag,
  Button,
  Segmented,
  Popconfirm,
  Drawer,
  Row,
  Col,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  ScissorOutlined,
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  DollarOutlined,
} from "@ant-design/icons";

const { Option } = Select;

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

export default function StylistAppointments({
  allBookings = [],
  filteredAppointments = [],
  filterSearch: externalSearch,
  setFilterSearch: externalSetSearch,
  filterStatus: externalStatus,
  setFilterStatus: externalSetStatus,
  formatDateTime: externalFormatDateTime,
  formatCurrency: externalFormatCurrency,
  handleStatusChange,
}) {
  const rawList = allBookings.length > 0 ? allBookings : filteredAppointments;

  // Local state for search & filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [periodFilter, setPeriodFilter] = useState("ALL"); // ALL | TODAY | WEEK | MONTH
  const [page, setPage] = useState({ current: 1, pageSize: 8 });

  // Detail Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const formatPrice = (p) => {
    if (externalFormatCurrency) return externalFormatCurrency(p);
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p || 0);
  };

  const formatDT = (dt) => {
    if (externalFormatDateTime) return externalFormatDateTime(dt);
    const d = parseToDate(dt);
    if (!d) return "—";
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter appointments by period, status, and search query
  const filteredList = useMemo(() => {
    const now = new Date();
    const todayStr = formatDateYMD(now);

    // Week boundaries: Monday to Sunday
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(monday.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // Month boundaries
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    return rawList.filter((b) => {
      // 1. Period Filter (Ngày / Tuần / Tháng)
      if (periodFilter !== "ALL" && b.startTime) {
        const bDate = parseToDate(b.startTime);
        if (!bDate) return false;
        const bDateStr = formatDateYMD(bDate);

        if (periodFilter === "TODAY" && bDateStr !== todayStr) return false;
        if (periodFilter === "WEEK" && (bDate < monday || bDate > sunday)) return false;
        if (periodFilter === "MONTH" && !bDateStr.startsWith(currentMonthKey)) return false;
      }

      // 2. Status Filter
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;

      // 3. Search query
      const query = (search || "").trim().toLowerCase();
      if (query) {
        const code = (b.bookingCode || "").toLowerCase();
        const customer = (b.customerName || b.userName || "").toLowerCase();
        const phone = (b.customerPhone || b.userPhone || "").toLowerCase();
        const service = (b.serviceName || "").toLowerCase();
        if (!code.includes(query) && !customer.includes(query) && !phone.includes(query) && !service.includes(query)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const da = parseToDate(a.startTime);
      const db = parseToDate(b.startTime);
      return (db ? db.getTime() : 0) - (da ? da.getTime() : 0);
    });
  }, [rawList, periodFilter, statusFilter, search]);

  // Statistics for quick counts
  const stats = useMemo(() => {
    return {
      total: filteredList.length,
      pending: filteredList.filter((b) => b.status === "PENDING").length,
      confirmed: filteredList.filter((b) => b.status === "CONFIRMED").length,
      completed: filteredList.filter((b) => b.status === "COMPLETED").length,
      cancelled: filteredList.filter((b) => b.status === "CANCELLED").length,
    };
  }, [filteredList]);

  return (
    <Card className="rounded-2xl border-gray-100 shadow-sm space-y-4">
      {/* Header and Period Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-black text-gray-900 mb-1 flex items-center gap-2">
            <CalendarOutlined className="text-blue-600" />
            Quản Lý Lịch Hẹn & Thao Tác
          </h2>
          <p className="text-xs text-gray-500 mb-0">
            Xem danh sách lịch hẹn, lọc theo ngày/tuần/tháng và thực hiện nhận lịch, hoàn thành cắt tóc hoặc hủy lịch
          </p>
        </div>

        {/* Lọc theo Ngày / Tuần / Tháng */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 shrink-0">Lọc theo:</span>
          <Segmented
            value={periodFilter}
            onChange={(val) => {
              setPeriodFilter(val);
              setPage((prev) => ({ ...prev, current: 1 }));
            }}
            options={[
              { label: "Tất cả", value: "ALL" },
              { label: "Hôm nay", value: "TODAY" },
              { label: "Tuần này", value: "WEEK" },
              { label: "Tháng này", value: "MONTH" },
            ]}
            className="font-bold text-xs p-1 bg-slate-100"
          />
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <Input
            placeholder="Tìm mã lịch, tên khách hàng, SĐT..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage((prev) => ({ ...prev, current: 1 }));
            }}
            allowClear
            className="w-full sm:w-72 rounded-xl"
          />

          <Select
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage((prev) => ({ ...prev, current: 1 }));
            }}
            className="w-full sm:w-44"
          >
            <Option value="ALL">Tất cả trạng thái</Option>
            <Option value="PENDING">Chờ xác nhận</Option>
            <Option value="CONFIRMED">Đã nhận lịch</Option>
            <Option value="IN_PROGRESS">Đang cắt tóc</Option>
            <Option value="COMPLETED">Đã hoàn thành</Option>
            <Option value="CANCELLED">Đã hủy</Option>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 self-end sm:self-center">
          <span>Tổng: <strong className="text-gray-900">{stats.total}</strong></span>
          <span>•</span>
          <span className="text-amber-600">Chờ nhận: <strong>{stats.pending}</strong></span>
          <span>•</span>
          <span className="text-blue-600">Đã nhận: <strong>{stats.confirmed}</strong></span>
          <span>•</span>
          <span className="text-emerald-600">Xong: <strong>{stats.completed}</strong></span>
        </div>
      </div>

      {/* Appointments Table */}
      <Table
        dataSource={filteredList}
        rowKey={(r) => r.id || r.bookingCode}
        scroll={{ x: 900 }}
        pagination={{
          current: page.current,
          pageSize: page.pageSize,
          showSizeChanger: true,
          pageSizeOptions: ["8", "16", "32", "64"],
          showTotal: (total) => `Tổng ${total} lịch hẹn`,
          onChange: (current, pageSize) => setPage({ current, pageSize }),
        }}
        columns={[
          {
            title: "Mã lịch",
            dataIndex: "bookingCode",
            key: "bookingCode",
            width: 140,
            render: (v) => (
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                #{v || "BB-2026"}
              </span>
            ),
          },
          {
            title: "Khách hàng",
            dataIndex: "customerName",
            key: "customerName",
            width: 160,
            render: (v, r) => (
              <div>
                <p className="font-bold text-xs text-gray-800 mb-0">{v || "Khách hàng"}</p>
                <span className="text-[11px] text-gray-400">{r.customerPhone || "—"}</span>
              </div>
            ),
          },
          {
            title: "Thời gian hẹn",
            dataIndex: "startTime",
            key: "startTime",
            width: 150,
            render: (v) => (
              <span className="text-xs text-gray-700 font-semibold">{formatDT(v)}</span>
            ),
          },
          {
            title: "Tổng tiền",
            dataIndex: "totalAmount",
            key: "totalAmount",
            width: 120,
            render: (v) => (
              <span className="font-bold text-xs text-amber-700">{formatPrice(v)}</span>
            ),
          },
          {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            width: 130,
            render: (v) => {
              switch (v) {
                case "PENDING":
                  return <Tag color="gold" className="text-xs font-bold rounded-full px-2.5">Chờ xác nhận</Tag>;
                case "CONFIRMED":
                  return <Tag color="blue" className="text-xs font-bold rounded-full px-2.5">Đã nhận lịch</Tag>;
                case "IN_PROGRESS":
                  return <Tag color="purple" className="text-xs font-bold rounded-full px-2.5">Đang cắt</Tag>;
                case "COMPLETED":
                  return <Tag color="green" className="text-xs font-bold rounded-full px-2.5">Hoàn thành</Tag>;
                case "CANCELLED":
                  return <Tag color="default" className="text-xs font-bold rounded-full px-2.5 text-gray-400">Đã hủy</Tag>;
                default:
                  return <Tag>{v}</Tag>;
              }
            },
          },
          {
            title: "Thao tác",
            key: "actions",
            width: 220,
            fixed: "right",
            render: (_, r) => (
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* 1. Thao tác khi CHỜ XÁC NHẬN */}
                {r.status === "PENDING" && (
                  <>
                    <Button
                      size="small"
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleStatusChange && handleStatusChange(r.id, "CONFIRMED")}
                      className="text-xs bg-blue-600 hover:bg-blue-700 font-bold rounded-lg h-7"
                    >
                      Nhận lịch
                    </Button>
                    <Popconfirm
                      title="Hủy lịch hẹn"
                      description="Bạn có chắc chắn muốn hủy lịch hẹn này không?"
                      okText="Hủy lịch"
                      cancelText="Không"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => handleStatusChange && handleStatusChange(r.id, "CANCELLED")}
                    >
                      <Button
                        size="small"
                        danger
                        icon={<CloseCircleOutlined />}
                        className="text-xs rounded-lg h-7"
                      >
                        Hủy
                      </Button>
                    </Popconfirm>
                  </>
                )}

                {/* 2. Thao tác khi ĐÃ NHẬN LỊCH */}
                {r.status === "CONFIRMED" && (
                  <Button
                    size="small"
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleStatusChange && handleStatusChange(r.id, "COMPLETED")}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 font-bold rounded-lg h-7"
                  >
                    Đã hoàn thành
                  </Button>
                )}

                {/* 3. Thao tác khi ĐANG CẮT TÓC */}
                {r.status === "IN_PROGRESS" && (
                  <Button
                    size="small"
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleStatusChange && handleStatusChange(r.id, "COMPLETED")}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 font-bold rounded-lg h-7"
                  >
                    Đã hoàn thành
                  </Button>
                )}

                {/* 4. Trạng thái HOÀN THÀNH */}
                {r.status === "COMPLETED" && (
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircleOutlined /> Đã hoàn tất
                  </span>
                )}

                {/* 5. Trạng thái ĐÃ HỦY */}
                {r.status === "CANCELLED" && (
                  <span className="text-[11px] text-gray-400">
                    Đã hủy lịch
                  </span>
                )}

                {/* Xem chi tiết */}
                <Tooltip title="Xem chi tiết lịch hẹn">
                  <Button
                    size="small"
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => {
                      setSelectedBooking(r);
                      setDrawerOpen(true);
                    }}
                    className="text-gray-500 hover:text-blue-600 h-7 w-7 p-0"
                  />
                </Tooltip>
              </div>
            ),
          },
        ]}
      />

      {/* Booking Detail Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <ScissorOutlined className="text-blue-600" />
            <span>Chi tiết Lịch hẹn #{selectedBooking?.bookingCode}</span>
          </div>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={420}
      >
        {selectedBooking && (
          <div className="space-y-4 text-sm text-gray-700">
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500 block">Trạng thái</span>
                <span className="font-bold text-sm text-gray-900">
                  {selectedBooking.status}
                </span>
              </div>
              <Tag
                color={
                  selectedBooking.status === "COMPLETED"
                    ? "green"
                    : selectedBooking.status === "CONFIRMED"
                    ? "blue"
                    : selectedBooking.status === "PENDING"
                    ? "gold"
                    : "default"
                }
                className="rounded-full font-bold px-3 py-1"
              >
                {selectedBooking.status}
              </Tag>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase text-gray-400 tracking-wider">Khách hàng</h4>
              <p className="font-bold text-gray-900 text-base mb-0">
                {selectedBooking.customerName || "Khách hàng"}
              </p>
              <p className="text-xs text-gray-600 mb-0">
                📞 SĐT: <strong>{selectedBooking.customerPhone || "—"}</strong>
              </p>
              {selectedBooking.customerEmail && (
                <p className="text-xs text-gray-600 mb-0">
                  ✉️ Email: {selectedBooking.customerEmail}
                </p>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100">
              <h4 className="font-bold text-xs uppercase text-gray-400 tracking-wider">Thời gian & Salon</h4>
              <p className="text-xs text-gray-700 mb-1">
                📅 Thời gian hẹn: <strong>{formatDT(selectedBooking.startTime)}</strong>
              </p>
              <p className="text-xs text-gray-700 mb-1">
                📍 Salon: <strong>{selectedBooking.salonName || "Salon BachBarber"}</strong>
              </p>
              {selectedBooking.salonAddress && (
                <p className="text-xs text-gray-500 mb-0">
                  Địa chỉ: {selectedBooking.salonAddress}
                </p>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100">
              <h4 className="font-bold text-xs uppercase text-gray-400 tracking-wider">Chi phí & Thanh toán</h4>
              <div className="flex justify-between items-center text-sm">
                <span>Tổng tiền:</span>
                <span className="font-black text-blue-600 text-base">
                  {formatPrice(selectedBooking.totalAmount)}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Phương thức: {selectedBooking.paymentMethod === "BANK_TRANSFER" ? "Chuyển khoản QR" : "Tiền mặt"}
              </p>
            </div>

            {selectedBooking.customerNotes && (
              <div className="pt-2 border-t border-gray-100">
                <h4 className="font-bold text-xs uppercase text-gray-400 tracking-wider">Ghi chú của khách</h4>
                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 mt-1">
                  {selectedBooking.customerNotes}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </Card>
  );
}
