import React, { useState, useMemo } from "react";
import { Card, Select, Table, Tag, Button, Modal, Row, Col, Statistic } from "antd";
import {
  DollarOutlined,
  EyeOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  CarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

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

  // Detail Modal for KPIs
  const [kpiModalTitle, setKpiModalTitle] = useState("");
  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const [kpiModalOrders, setKpiModalOrders] = useState([]);

  // Compute Order Metrics
  const orderList = Array.isArray(orders) ? orders : [];
  const totalOrders = orderList.length;
  const pendingOrders = orderList.filter((o) => o?.status === "PENDING" || o?.orderStatus === "PENDING");
  const shippingOrders = orderList.filter(
    (o) => o?.status === "SHIPPING" || o?.status === "SHIPPED" || o?.orderStatus === "SHIPPING" || o?.orderStatus === "SHIPPED"
  );
  const deliveredOrders = orderList.filter(
    (o) =>
      o?.status === "DELIVERED" ||
      o?.orderStatus === "DELIVERED" ||
      o?.status === "COMPLETED" ||
      o?.orderStatus === "COMPLETED"
  );
  const totalOrderRevenue = deliveredOrders.reduce((sum, o) => sum + (Number(o?.finalAmount ?? o?.totalAmount) || 0), 0);

  const handleOpenKpiDetail = (title, list) => {
    setKpiModalTitle(title);
    setKpiModalOrders(list);
    setKpiModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* ── TOP KPI OVERVIEW CARDS WITH DRILL-DOWN ── */}
      <Row gutter={[16, 16]}>
        {/* Total Orders */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-purple-50/60 group"
            onClick={() => handleOpenKpiDetail("Tất cả đơn hàng Shop", orderList)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-purple-700">Tổng đơn hàng</span>
              <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700 text-xs">
                <ShoppingOutlined />
              </span>
            </div>
            <Statistic
              value={totalOrders}
              suffix={<span className="text-xs text-gray-400 font-normal">đơn</span>}
              valueStyle={{ fontWeight: 900, color: "#581c87" }}
            />
            <div className="mt-2 text-xs text-purple-600 font-medium flex items-center justify-between group-hover:underline">
              <span>Bấm xem danh sách</span>
              <EyeOutlined />
            </div>
          </Card>
        </Col>

        {/* Pending Orders */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-amber-50/60 group"
            onClick={() => handleOpenKpiDetail("Đơn hàng Chờ xác nhận (Pending)", pendingOrders)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-amber-700">Chờ xử lý</span>
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700 text-xs">
                <ClockCircleOutlined />
              </span>
            </div>
            <Statistic
              value={pendingOrders.length}
              suffix={<span className="text-xs text-gray-400 font-normal">đơn</span>}
              valueStyle={{ fontWeight: 900, color: "#78350f" }}
            />
            <div className="mt-2 text-xs text-amber-700 font-medium flex items-center justify-between group-hover:underline">
              <span>Cần đóng gói & giao</span>
              <EyeOutlined />
            </div>
          </Card>
        </Col>

        {/* Shipping Orders */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-blue-50/60 group"
            onClick={() => handleOpenKpiDetail("Đơn hàng Đang vận chuyển", shippingOrders)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-blue-700">Đang giao hàng</span>
              <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700 text-xs">
                <CarOutlined />
              </span>
            </div>
            <Statistic
              value={shippingOrders.length}
              suffix={<span className="text-xs text-gray-400 font-normal">đơn</span>}
              valueStyle={{ fontWeight: 900, color: "#1e3a8a" }}
            />
            <div className="mt-2 text-xs text-blue-600 font-medium flex items-center justify-between group-hover:underline">
              <span>Đang gửi bưu tá</span>
              <EyeOutlined />
            </div>
          </Card>
        </Col>

        {/* Delivered / Revenue Orders */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-emerald-50/60 group"
            onClick={() => handleOpenKpiDetail("Đơn hàng Đã giao thành công", deliveredOrders)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-emerald-700">Doanh thu Shop</span>
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs">
                <CheckCircleOutlined />
              </span>
            </div>
            <Statistic
              value={totalOrderRevenue}
              formatter={(v) => formatCurrency(v)}
              valueStyle={{ fontWeight: 900, color: "#065f46" }}
            />
            <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center justify-between group-hover:underline">
              <span>{deliveredOrders.length} đơn giao xong</span>
              <EyeOutlined />
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        className="rounded-xl border-gray-100 shadow-sm"
        title={<span className="font-bold">🛒 Danh sách đơn hàng ({orderList.length})</span>}
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
          dataSource={orderList.filter((o) => {
            if (orderStatusFilter === "ALL") return true;
            const s = o?.status === "SHIPPED" ? "SHIPPING" : o?.status;
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
              render: (v) => <span className="font-bold text-red-600">{formatCurrency(v)}</span>,
            },
            {
              title: "Thanh toán",
              dataIndex: "paymentMethod",
              key: "payment",
              render: (v, r) => {
                const method = (v || "").toUpperCase();
                const isPaid = r.paymentStatus === "SUCCESS" || r.paymentStatus === "PAID";
                const isFailed = r.paymentStatus === "FAILED";

                let methodTag = null;
                if (method.includes("VNPAY")) {
                  methodTag = (
                    <Tag color="blue" className="font-bold mr-0">
                      Cổng VNPay
                    </Tag>
                  );
                } else if (method.includes("BANK_TRANSFER") || method.includes("SEPAY") || method.includes("BANK")) {
                  methodTag = (
                    <Tag color="cyan" className="font-bold mr-0">
                      Chuyển khoản VietQR
                    </Tag>
                  );
                } else {
                  methodTag = (
                    <Tag color="orange" className="font-bold mr-0">
                      Tiền mặt (COD)
                    </Tag>
                  );
                }

                return (
                  <div className="flex flex-col gap-1 items-start">
                    {methodTag}
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isPaid
                          ? "bg-green-100 text-green-700"
                          : isFailed
                          ? "bg-red-100 text-red-600"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {isPaid ? "● Đã thanh toán" : isFailed ? "● Thất bại" : "○ Chờ thanh toán"}
                    </span>
                  </div>
                );
              },
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
                  DELIVERED: ["success", "Đã giao hàng"],
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
              render: (_, r) => {
                const orderId = r.id || r.orderId;
                const isDelivered = r.status === "DELIVERED";
                const isCancelled = r.status === "CANCELLED";

                return (
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

                    {/* Quick Confirm Delivered Button for Admin */}
                    {!isDelivered && !isCancelled && (
                      <Button
                        size="small"
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleUpdateOrderStatus(orderId, "DELIVERED")}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 border-none shadow-xs font-semibold"
                        title="Xác nhận đơn hàng đã giao thành công"
                      >
                        Đã giao
                      </Button>
                    )}

                    <Select
                      value={r.status === "SHIPPED" ? "SHIPPING" : r.status}
                      size="small"
                      className="w-32"
                      onChange={(val) => handleUpdateOrderStatus(orderId, val)}
                    >
                      <Option value="PENDING">Chờ xử lý</Option>
                      <Option value="CONFIRMED">Đã xác nhận</Option>
                      <Option value="PROCESSING">Đang xử lý</Option>
                      <Option value="SHIPPING">Đang giao</Option>
                      <Option value="DELIVERED">Đã giao hàng</Option>
                      <Option value="CANCELLED">Đã hủy</Option>
                    </Select>
                  </div>
                );
              },
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
                  {(selectedOrder.paymentMethod || "").toUpperCase().includes("VNPAY")
                    ? "Cổng thanh toán điện tử VNPay (Online)"
                    : (selectedOrder.paymentMethod || "").toUpperCase().includes("BANK")
                    ? "Chuyển khoản ngân hàng VietQR"
                    : "Tiền mặt khi giao hàng (COD)"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-500">Trạng thái thanh toán:</span>
                  <Tag
                    color={
                      selectedOrder.paymentStatus === "SUCCESS" || selectedOrder.paymentStatus === "PAID"
                        ? "success"
                        : selectedOrder.paymentStatus === "FAILED"
                        ? "error"
                        : "warning"
                    }
                  >
                    {selectedOrder.paymentStatus === "SUCCESS" || selectedOrder.paymentStatus === "PAID"
                      ? "Đã thanh toán thành công"
                      : selectedOrder.paymentStatus === "FAILED"
                      ? "Thanh toán thất bại"
                      : "Chờ thanh toán"}
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
                  dataSource={selectedOrder.items || selectedOrder.orderDetails || []}
                  rowKey={(i) => i.orderDetailId || i.id || i.productId || Math.random()}
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
                              item.productThumbnail ||
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
                      key: "unitPrice",
                      render: (_, item) => <span>{formatCurrency(item.unitPrice ?? item.price)}</span>,
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
                      key: "lineTotal",
                      align: "right",
                      render: (_, r) => (
                        <span className="font-bold text-red-600">
                          {formatCurrency(r.totalPrice ?? (Number(r.unitPrice ?? r.price) * Number(r.quantity)))}
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
                <span>{formatCurrency(selectedOrder.totalAmount || selectedOrder.finalAmount)}</span>
              </div>
              {selectedOrder.shippingFee > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển:</span>
                  <span>+{formatCurrency(selectedOrder.shippingFee)}</span>
                </div>
              )}
              {selectedOrder.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Giảm giá:</span>
                  <span>-{formatCurrency(selectedOrder.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-red-600 pt-1.5 border-t border-gray-200">
                <span>Tổng cộng thanh toán:</span>
                <span>{formatCurrency(selectedOrder.finalAmount)}</span>
              </div>
            </div>

            {/* Status Update Control */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 flex-wrap gap-2">
              <span className="font-bold text-gray-700">Cập nhật trạng thái đơn:</span>
              <div className="flex items-center gap-2">
                {selectedOrder.status !== "DELIVERED" && selectedOrder.status !== "CANCELLED" && (
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => {
                      const oid = selectedOrder.id || selectedOrder.orderId;
                      handleUpdateOrderStatus(oid, "DELIVERED");
                      setSelectedOrder((prev) =>
                        prev ? { ...prev, status: "DELIVERED", paymentStatus: "SUCCESS" } : null
                      );
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 border-none font-semibold text-xs"
                  >
                    Xác nhận đã giao
                  </Button>
                )}
                <Select
                  value={selectedOrder.status === "SHIPPED" ? "SHIPPING" : selectedOrder.status}
                  onChange={(val) => {
                    const oid = selectedOrder.id || selectedOrder.orderId;
                    handleUpdateOrderStatus(oid, val);
                    setSelectedOrder((prev) =>
                      prev
                        ? {
                            ...prev,
                            status: val,
                            paymentStatus: val === "DELIVERED" ? "SUCCESS" : prev.paymentStatus,
                          }
                        : null
                    );
                  }}
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
                  onClick={() => {
                    setOrderModalOpen(false);
                    setSelectedOrder(null);
                  }}
                  className="border-gray-300"
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL: KPI ORDERS LIST DRILL-DOWN ── */}
      <Modal
        title={<span className="font-bold text-gray-800">{kpiModalTitle} ({kpiModalOrders.length})</span>}
        open={kpiModalOpen}
        onCancel={() => setKpiModalOpen(false)}
        footer={null}
        width={850}
        centered
        destroyOnHidden
      >
        <div className="mt-4">
          <Table
            dataSource={kpiModalOrders}
            rowKey={(r) => r.id || r.orderId || r.orderCode}
            size="small"
            pagination={{ pageSize: 6 }}
            columns={[
              {
                title: "Mã đơn",
                dataIndex: "orderCode",
                render: (v) => <span className="font-mono text-xs font-bold text-blue-700">{v || "—"}</span>,
              },
              {
                title: "Người nhận",
                dataIndex: "receiverName",
                render: (v, r) => (
                  <div>
                    <div className="font-bold text-xs">{v || r.userName || "Khách hàng"}</div>
                    <div className="text-[10px] text-gray-400">{r.receiverPhone}</div>
                  </div>
                ),
              },
              {
                title: "Phương thức",
                dataIndex: "paymentMethod",
                render: (v) => {
                  const m = (v || "").toUpperCase();
                  if (m.includes("VNPAY")) return <Tag color="blue" className="text-[11px] font-bold">VNPay</Tag>;
                  if (m.includes("BANK")) return <Tag color="cyan" className="text-[11px] font-bold">VietQR</Tag>;
                  return <Tag color="orange" className="text-[11px] font-bold">Tiền mặt (COD)</Tag>;
                },
              },
              {
                title: "Tổng tiền",
                dataIndex: "finalAmount",
                render: (v, r) => <span className="font-bold text-xs text-purple-700">{formatCurrency(v ?? r.totalAmount)}</span>,
              },
              {
                title: "Trạng thái",
                dataIndex: "status",
                render: (v) => (
                  <Tag
                    color={
                      v === "DELIVERED"
                        ? "success"
                        : v === "SHIPPING"
                        ? "blue"
                        : v === "CANCELLED"
                        ? "error"
                        : "warning"
                    }
                    className="text-[10px]"
                  >
                    {v}
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
