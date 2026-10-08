import React, { useState } from "react";
import { Card, Input, Select, Table } from "antd";
import { SearchOutlined } from "@ant-design/icons";

const { Option } = Select;

export default function AdminUsersView({
  userSearch,
  setUserSearch,
  userTierFilter,
  setUserTierFilter,
  filteredUsers = [],
  users = [],
  USER_COLUMNS = [],
}) {
  const [pagination, setPagination] = useState({ current: 1, pageSize: 8 });

  return (
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
          scroll={{ x: 800 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            showSizeChanger: true,
            pageSizeOptions: ["8", "16", "32", "50", "100"],
            showTotal: (total) => `Tổng ${total} tài khoản`,
            onChange: (current, pageSize) => setPagination({ current, pageSize }),
          }}
          className="border border-gray-100 rounded-xl overflow-hidden"
        />
      </Card>
    </div>
  );
}
