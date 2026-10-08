import React, { useState } from "react";
import { Card, Select, Table, Tag, Button, Modal } from "antd";
import { DollarOutlined, EyeOutlined } from "@ant-design/icons";

const { Option } = Select;

export default function AdminOrdersView({
  orders = [],
  orderStatusFilter = "ALL",
  setOrderStatusFilter,
  formatCurrency,
  selectedOrder,
  setSelectedOrder,
  orderModalOpen,
  setOrderModalOpen,
  handleUpdateOrderStatus,
}) {
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  return (
    <div className="space-y-6">
      <Card
        className="rounded-xl border-gray-100 shadow-sm"
        title={<span className="font-bold">🛒 Quản lý đơn hàng ({orders.length})</span>}
        extra={
          <Select
            value={orderStatusFilter}
            onChange={setOrderStatusFilter}
            className="w-44"
          >
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
          dataSource={orders.filter((o) => {
            if (orderStatusFilter === "ALL") return true;
            const s = o.status === "SHIPPED" ? "SHIPPING" : o.status;
            return s === orderStatusFilter;
          })}
          rowKey={(r) => r.id || r.orderId || r.orderCode}
          size="middle"
          scroll={{ x: 950 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (t) => `${t} đơn hàng`,
            onChange: (current, pageSize) => setPagination({ current, pageSize }),
          }}
          columns={[
            {
              title: "Mã đơn hàng",
              dataIndex: "orderCode",
              key: "orderCode",
              render: (v) => (
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {v}
                </span>
              ),
            },
            {
              title: "Khách hàng",
              key: "customer",
              render: (_, r) => (
                <div>
                  <p className="font-semibold text-sm mb-0">{r.receiverName || r.userName}</p>
                  <p className="text-xs text-gray-400 mb-0">{r.receiverPhone}</p>
                </div>
              ),
            },
            {
              title: "Tổng tiền",
              dataIndex: "finalAmount",
              key: "amount",
              render: (v) => <span className="font-bold text-red-600">{formatCurrency(v)}đ</span>,
            },
            {
              title: "Thanh toán",
              dataIndex: "paymentMethod",
              key: "payment",
              render: (v) => (
                <Tag color={v === "BANK_TRANSFER" ? "blue" : "green"}>
                  {v === "BANK_TRANSFER" ? "Chuyển khoản" : "Tiền mặt"}
                </Tag>
              ),
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              key: "status",
              render: (v) => {
                const norm = v === "SHIPPED" ? "SHIPPING" : v;
                const cfg = {
                  PENDING: ["warning", "Chờ xử lý"],
                  CONFIRMED: ["processing", "Đã xác nhận"],
                  PROCESSING: ["cyan", "Đang xử lý"],
                  SHIPPING: ["blue", "Đang giao"],
                  DELIVERED: ["success", "Đã giao"],
                  CANCELLED: ["error", "Đã hủy"],
                };
                const [color, label] = cfg[norm] || ["default", v];
                return <Tag color={color}>{label}</Tag>;
              },
            },
            {
              title: "Ngày đặt",
              dataIndex: "createdAt",
              key: "date",
              render: (v) => (v ? new Date(v).toLocaleDateString("vi-VN") : "—"),
            },
            {
              title: "Hành động",
              key: "actions",
              render: (_, r) => (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => {
                      setSelectedOrder(r);
                      setOrderModalOpen(true);
                    }}
                    className="text-xs text-blue-600 border-blue-200"
                  >
                    Chi tiết
                  </Button>
                  <Select
                    value={r.status === "SHIPPED" ? "SHIPPING" : r.status}
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

      {/* ── MODAL: ORDER DETAIL ────────────────────────────────────── */}
      {selectedOrder && (
        <Modal
          open={orderModalOpen}
          onCancel={() => {
            setOrderModalOpen(false);
            setSelectedOrder(null);
          }}
          footer={null}
          title={
            <div className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-2">
                <DollarOutlined className="text-blue-600 text-lg" />
                <span className="font-bold text-base">Chi tiết Đơn hàng #{selectedOrder.orderCode}</span>
              </div>
              <Tag
                color={
                  selectedOrder.status === "DELIVERED"
                    ? "success"
                    : selectedOrder.status === "SHIPPING" || selectedOrder.status === "SHIPPED"
                    ? "blue"
                    : selectedOrder.status === "PROCESSING"
                    ? "cyan"
                    : selectedOrder.status === "CONFIRMED"
                    ? "processing"
                    : selectedOrder.status === "CANCELLED"
                    ? "error"
                    : "warning"
                }
                className="font-bold text-xs"
              >
                {selectedOrder.status}
              </Tag>
            </div>
          }
          width={720}
          className="rounded-2xl"
          style={{ maxWidth: "95vw" }}
        >
          <div className="py-2 space-y-4 text-xs">
            {/* Customer & Shipping Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-gray-100">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Thông tin người nhận
                </p>
                <p className="font-bold text-sm text-gray-800 mb-0.5">
                  {selectedOrder.receiverName || selectedOrder.userName}
                </p>
                <p className="text-gray-600 mb-0.5">📞 {selectedOrder.receiverPhone}</p>
                <p className="text-gray-600 mb-0">📍 {selectedOrder.shippingAddress || "Nhận tại Salon"}</p>
                {selectedOrder.note && (
                  <p className="text-gray-500 italic mt-1 mb-0">Ghi chú: "{selectedOrder.note}"</p>
                )}
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Phương thức thanh toán
                </p>
                <p className="font-bold text-sm text-gray-800 mb-0.5">
                  {selectedOrder.paymentMethod === "BANK_TRANSFER"
                    ? "Chuyển khoản VietQR"
                    : "Tiền mặt khi giao hàng (COD)"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-500">Trạng thái thanh toán:</span>
                  <Tag color={selectedOrder.paymentStatus === "SUCCESS" ? "success" : "warning"}>
                    {selectedOrder.paymentStatus === "SUCCESS" ? "Đã thanh toán" : "Chưa thanh toán"}
                  </Tag>
                </div>
                <p className="text-gray-400 mt-2 mb-0">
                  Ngày đặt: {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString("vi-VN") : "—"}
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
                  scroll={{ x: 500 }}
                  columns={[
                    {
                      title: "Sản phẩm",
                      key: "item",
                      render: (_, item) => (
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              item.productImage ||
                              "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=100&auto=format&fit=crop"
                            }
                            alt={item.productName}
                            className="w-9 h-9 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                          />
                          <span className="font-semibold text-xs text-gray-800 line-clamp-1">
                            {item.productName}
                          </span>
                        </div>
                      ),
                    },
                    {
                      title: "Đơn giá",
                      dataIndex: "unitPrice",
                      key: "unitPrice",
                      render: (v) => <span>{formatCurrency(v)}đ</span>,
                    },
                    {
                      title: "Số lượng",
                      dataIndex: "quantity",
                      key: "qty",
                      align: "center",
                      render: (v) => <Tag color="blue" className="font-bold">{v}</Tag>,
                    },
                    {
                      title: "Thành tiền",
                      dataIndex: "totalPrice",
                      key: "lineTotal",
                      align: "right",
                      render: (v, r) => (
                        <span className="font-bold text-red-600">
                          {formatCurrency(v || Number(r.unitPrice) * Number(r.quantity))}đ
                        </span>
                      ),
                    },
                  ]}
                  locale={{ emptyText: "Không có thông tin chi tiết món hàng" }}
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
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 flex-wrap gap-2">
              <span className="font-bold text-gray-700">Cập nhật trạng thái đơn:</span>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedOrder.status === "SHIPPED" ? "SHIPPING" : selectedOrder.status}
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
                <Button
                  type="primary"
                  onClick={() => {
                    setOrderModalOpen(false);
                    setSelectedOrder(null);
                  }}
                  className="bg-blue-600"
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
