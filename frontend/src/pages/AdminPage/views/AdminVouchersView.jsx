import React, { useState } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Button,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
} from "antd";
import {
  GiftOutlined,
  PlusOutlined,
  PercentageOutlined,
  TagOutlined,
} from "@ant-design/icons";

const { Option } = Select;

export default function AdminVouchersView({
  vouchers = [],
  VOUCHER_COLUMNS = [],
  voucherModalOpen,
  setVoucherModalOpen,
  voucherForm,
  handleCreateVoucherSubmit,
  creatingVoucher,
}) {
  const [pagination, setPagination] = useState({ current: 1, pageSize: 8 });

  return (
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
              {vouchers.filter((v) => v.isActive).length} voucher đang có hiệu lực
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
              value={vouchers.filter((v) => v.isPublic).length}
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
          scroll={{ x: 800 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            showSizeChanger: true,
            pageSizeOptions: ["8", "16", "32", "50", "100"],
            showTotal: (total) => `Tổng ${total} voucher`,
            onChange: (current, pageSize) => setPagination({ current, pageSize }),
          }}
          className="ant-table-modern"
        />
      </Card>

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
        style={{ maxWidth: "95vw" }}
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
    </div>
  );
}
