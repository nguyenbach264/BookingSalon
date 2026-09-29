import React, { useState } from "react";
import { Card, Input, Select, Tag, Table } from "antd";
import { SearchOutlined } from "@ant-design/icons";

const { Option } = Select;

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

  return (
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

        {/* Bookings Table */}
        <Table
          dataSource={filteredBookings}
          columns={BOOKING_COLUMNS}
          rowKey={(r) => r.id || r.bookingCode}
          scroll={{ x: 800 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            showSizeChanger: true,
            pageSizeOptions: ["8", "16", "32", "50", "100"],
            showTotal: (total) => `Tổng ${total} lịch hẹn`,
            onChange: (current, pageSize) => setPagination({ current, pageSize }),
          }}
          className="border border-gray-100 rounded-xl overflow-hidden"
        />
      </Card>
    </div>
  );
}
