import React, { useState } from "react";
import {
  Card,
  Input,
  Select,
  Tag,
  Table,
  Row,
  Col,
  Statistic,
  Modal,
  Badge,
} from "antd";
import {
  SearchOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  EyeOutlined,
} from "@ant-design/icons";

const { Option } = Select;

const formatCurrency = (val) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val ?? 0);

export default function AdminBookingsView({
  bookingSearch,
  setBookingSearch,
  bookingStatusFilter,
  setBookingStatusFilter,
  bookingSalonFilter,
  setBookingSalonFilter,
  salons = [],
  pendingCount = 0,
  confirmedCount = 0,
  completedCount = 0,
  filteredBookings = [],
  BOOKING_COLUMNS = [],
}) {
  const [pagination, setPagination] = useState({ current: 1, pageSize: 8 });

  // Detail Modal State
  const [detailModalTitle, setDetailModalTitle] = useState("");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalData, setDetailModalData] = useState([]);

  const cancelledCount = filteredBookings.filter((b) => b.status === "CANCELLED").length;
  const inProgressCount = filteredBookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "IN_PROGRESS"
  ).length;

  const handleOpenStatusDetail = (title, statusKey) => {
    setDetailModalTitle(title);
    const list = statusKey === "ALL"
      ? filteredBookings
      : statusKey === "IN_PROGRESS"
      ? filteredBookings.filter((b) => b.status === "CONFIRMED" || b.status === "IN_PROGRESS")
      : filteredBookings.filter((b) => b.status === statusKey);
    setDetailModalData(list);
    setDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* ── TOP KPI STATS CARDS WITH CLICKABLE DRILL-DOWN MODALS ── */}
      <Row gutter={[16, 16]}>
        {/* Total Bookings Card */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-blue-50/60 group"
            onClick={() => handleOpenStatusDetail("Danh sách tất cả Lịch hẹn", "ALL")}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-blue-700">Tổng lịch hẹn</span>
              <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700 text-xs">
                <CalendarOutlined />
              </span>
            </div>
            <Statistic
              value={filteredBookings.length}
              suffix={<span className="text-xs text-gray-400 font-normal">lượt</span>}
              valueStyle={{ fontWeight: 900, color: "#1e3a8a" }}
            />
            <div className="mt-2 text-xs text-blue-600 font-medium flex items-center justify-between group-hover:underline">
              <span>Bấm xem danh sách</span>
              <EyeOutlined />
            </div>
          </Card>
        </Col>

        {/* Pending Card */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-amber-50/60 group"
            onClick={() => handleOpenStatusDetail("Danh sách Lịch hẹn Chờ xác nhận (Pending)", "PENDING")}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-amber-700">Chờ xác nhận</span>
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700 text-xs">
                <ClockCircleOutlined />
              </span>
            </div>
            <Statistic
              value={pendingCount}
              suffix={<span className="text-xs text-gray-400 font-normal">lịch</span>}
              valueStyle={{ fontWeight: 900, color: "#78350f" }}
            />
            <div className="mt-2 text-xs text-amber-700 font-medium flex items-center justify-between group-hover:underline">
              <span>Cần duyệt ngay</span>
              <EyeOutlined />
            </div>
          </Card>
        </Col>

        {/* Confirmed / In Progress Card */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-sky-50/60 group"
            onClick={() => handleOpenStatusDetail("Danh sách Lịch hẹn Đang thực hiện / Đã xác nhận", "IN_PROGRESS")}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-sky-700">Đã duyệt / Đang làm</span>
              <span className="p-1.5 rounded-lg bg-sky-100 text-sky-700 text-xs">
                <CheckCircleOutlined />
              </span>
            </div>
            <Statistic
              value={inProgressCount}
              suffix={<span className="text-xs text-gray-400 font-normal">lịch</span>}
              valueStyle={{ fontWeight: 900, color: "#0369a1" }}
            />
            <div className="mt-2 text-xs text-sky-600 font-medium flex items-center justify-between group-hover:underline">
              <span>Đang phục vụ khách</span>
              <EyeOutlined />
            </div>
          </Card>
        </Col>

        {/* Completed Card */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-emerald-50/60 group"
            onClick={() => handleOpenStatusDetail("Danh sách Lịch hẹn Đã hoàn thành (Completed)", "COMPLETED")}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-emerald-700">Đã hoàn thành</span>
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs">
                <DollarOutlined />
              </span>
            </div>
            <Statistic
              value={completedCount}
              suffix={<span className="text-xs text-gray-400 font-normal">lịch</span>}
              valueStyle={{ fontWeight: 900, color: "#065f46" }}
            />
            <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center justify-between group-hover:underline">
              <span>Đã thanh toán xong</span>
              <EyeOutlined />
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── FILTERS & DATA TABLE ── */}
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
                <Option key={s.id} value={s.id}>
                  {s.salonName}
                </Option>
              ))}
            </Select>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Tag color="gold">Chờ duyệt: {pendingCount}</Tag>
            <Tag color="processing">Đã xác nhận: {confirmedCount}</Tag>
            <Tag color="success">Hoàn thành: {completedCount}</Tag>
          </div>
        </div>

        <Table
          dataSource={filteredBookings}
          columns={BOOKING_COLUMNS}
          rowKey={(r) => r.id || r.bookingCode}
          scroll={{ x: 850 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            showSizeChanger: true,
            pageSizeOptions: ["8", "16", "32", "50", "100"],
            showTotal: (total) => `Tổng ${total} lịch đặt`,
            onChange: (current, pageSize) => setPagination({ current, pageSize }),
          }}
          className="border border-gray-100 rounded-xl overflow-hidden"
        />
      </Card>

      {/* ── DETAIL MODAL FOR KPI CARDS ── */}
      <Modal
        title={<span className="font-bold text-gray-800">{detailModalTitle} ({detailModalData.length})</span>}
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={850}
        centered
        destroyOnClose
      >
        <div className="mt-4">
          <Table
            dataSource={detailModalData}
            rowKey={(r) => r.id || r.bookingCode}
            size="small"
            pagination={{ pageSize: 6 }}
            columns={[
              {
                title: "Mã lịch",
                dataIndex: "bookingCode",
                render: (v) => <span className="font-mono text-xs font-bold text-blue-700">{v || "—"}</span>,
              },
              {
                title: "Khách hàng",
                dataIndex: "customerName",
                render: (v, r) => (
                  <div>
                    <div className="font-bold text-xs">{v || "Khách vãng lai"}</div>
                    <div className="text-[10px] text-gray-400">{r.customerPhone}</div>
                  </div>
                ),
              },
              {
                title: "Dịch vụ",
                dataIndex: "serviceName",
                render: (v) => <span className="text-xs">{v || "Cắt tóc"}</span>,
              },
              {
                title: "Stylist",
                dataIndex: "stylistName",
                render: (v) => <span className="text-xs text-gray-600">{v || "—"}</span>,
              },
              {
                title: "Chi nhánh",
                dataIndex: "salonName",
                render: (v) => <span className="text-xs text-gray-500">{v || "—"}</span>,
              },
              {
                title: "Tổng tiền",
                dataIndex: "totalAmount",
                render: (v) => <span className="font-bold text-xs text-amber-700">{formatCurrency(v)}</span>,
              },
              {
                title: "Trạng thái",
                dataIndex: "status",
                render: (v) => (
                  <Tag
                    color={v === "COMPLETED" ? "success" : v === "PENDING" ? "warning" : v === "CANCELLED" ? "error" : "processing"}
                    className="text-[10px]"
                  >
                    {v === "COMPLETED" ? "Xong" : v === "PENDING" ? "Chờ duyệt" : v === "CANCELLED" ? "Đã hủy" : "Đã nhận"}
                  </Tag>
                ),
              },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}
