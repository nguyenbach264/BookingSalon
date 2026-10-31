import React, { useState, useMemo } from "react";
import {
  Row,
  Col,
  Card,
  Segmented,
  Progress,
  Avatar,
  Tag,
  Statistic,
  Badge,
  Alert,
  Tooltip,
  Button,
  Modal,
  Table,
  Descriptions,
} from "antd";
import {
  FireOutlined,
  StarOutlined,
  ShopOutlined,
  ShoppingOutlined,
  DollarOutlined,
  RiseOutlined,
  PieChartOutlined,
  CreditCardOutlined,
  AlertOutlined,
  UsergroupAddOutlined,
  CheckCircleOutlined,
  PercentageOutlined,
  WalletOutlined,
  QrcodeOutlined,
  EyeOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";

export default function AdminStatsView({
  statsRange = "30_DAYS",
  setStatsRange,
  topServicesData = [],
  stylists = [],
  salons = [],
  bookings = [],
  orders = [],
  products = [],
  productStats = null,
  formatCurrency,
}) {
  // Modal detail states for drill-down analysis
  const [detailModalTitle, setDetailModalTitle] = useState("");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalContent, setDetailModalContent] = useState(null);

  // Filter bookings and orders by selected statsRange
  const { filteredBookings, filteredOrders, rangeLabel } = useMemo(() => {
    const now = new Date();
    let startDate;
    let label = "30 ngày qua";

    switch (statsRange) {
      case "TODAY":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        label = "Hôm nay";
        break;
      case "7_DAYS":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        label = "7 ngày qua";
        break;
      case "30_DAYS":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        label = "30 ngày qua";
        break;
      case "QUARTER":
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        label = "Quý này";
        break;
      case "YEAR":
        startDate = new Date(now.getFullYear(), 0, 1);
        label = "Năm nay (2026)";
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const parseDate = (d) => {
      if (!d) return null;
      if (Array.isArray(d)) return new Date(d[0], (d[1] || 1) - 1, d[2] || 1);
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? null : dt;
    };

    const fBookings = bookings.filter((b) => {
      const dt = parseDate(b.startTime || b.bookingDate);
      return dt && dt >= startDate && dt <= now;
    });

    const fOrders = orders.filter((o) => {
      const dt = parseDate(o.createdAt || o.orderDate);
      return dt && dt >= startDate && dt <= now;
    });

    return {
      filteredBookings: fBookings.length > 0 ? fBookings : bookings,
      filteredOrders: fOrders.length > 0 ? fOrders : orders,
      rangeLabel: label,
    };
  }, [statsRange, bookings, orders]);

  // Financial Breakdown: Salon Revenue vs. Shop Revenue
  const financials = useMemo(() => {
    const completedBookings = filteredBookings.filter((b) => b.status === "COMPLETED");
    const isOrderPaidOrDelivered = (o) => {
      const st = String(o.status || o.orderStatus || "").toUpperCase();
      const ps = String(o.paymentStatus || "").toUpperCase();
      return st === "DELIVERED" || st === "COMPLETED" || ps === "SUCCESS" || ps === "PAID";
    };
    const validOrders = filteredOrders.filter(isOrderPaidOrDelivered);

    const bookingRevenue = completedBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
    const shopRevenue = validOrders.reduce((sum, o) => sum + (Number(o.finalAmount ?? o.totalAmount) || 0), 0);
    const grossRevenue = bookingRevenue + shopRevenue;

    // Stylist Commission Cost (standard 20% on completed salon bookings)
    const stylistCommission = Math.round(bookingRevenue * 0.20);
    // Product Cost of Goods Sold (COGS - estimated 50% of shop retail price)
    const productCOGS = Math.round(shopRevenue * 0.50);
    // Voucher & Promotion Discounts
    const voucherDiscountSum = filteredOrders.reduce((sum, o) => sum + (Number(o.discountAmount) || 0), 0);
    // Estimated Net Margin
    const netProfit = Math.max(0, grossRevenue - stylistCommission - productCOGS - voucherDiscountSum);
    const netMarginPct = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0;

    const bookingShare = grossRevenue > 0 ? Math.round((bookingRevenue / grossRevenue) * 100) : 50;
    const shopShare = 100 - bookingShare;

    const bookingAOV = completedBookings.length > 0 ? Math.round(bookingRevenue / completedBookings.length) : 0;
    const shopAOV = validOrders.length > 0 ? Math.round(shopRevenue / validOrders.length) : 0;

    return {
      grossRevenue,
      bookingRevenue,
      shopRevenue,
      bookingShare,
      shopShare,
      stylistCommission,
      productCOGS,
      voucherDiscountSum,
      netProfit,
      netMarginPct,
      completedBookings,
      validOrders,
      bookingAOV,
      shopAOV,
    };
  }, [filteredBookings, filteredOrders]);

  // Payment Methods Distribution (VietQR SePay, VNPay, COD)
  const paymentMethods = useMemo(() => {
    let sepay = 0;
    let vnpay = 0;
    let cod = 0;

    const sepayOrders = [];
    const vnpayOrders = [];
    const codOrders = [];

    filteredOrders.forEach((o) => {
      const pm = (o.paymentMethod || "").toUpperCase();
      const amt = Number(o.finalAmount ?? o.totalAmount) || 0;
      if (pm.includes("SEPAY") || pm.includes("QR") || pm.includes("VIETQR") || pm === "BANK_TRANSFER") {
        sepay += amt;
        sepayOrders.push(o);
      } else if (pm.includes("VNPAY")) {
        vnpay += amt;
        vnpayOrders.push(o);
      } else {
        cod += amt;
        codOrders.push(o);
      }
    });

    const total = sepay + vnpay + cod || 1;
    return {
      sepay: { amount: sepay, pct: Math.round((sepay / total) * 100), orders: sepayOrders },
      vnpay: { amount: vnpay, pct: Math.round((vnpay / total) * 100), orders: vnpayOrders },
      cod: { amount: cod, pct: Math.round((cod / total) * 100), orders: codOrders },
    };
  }, [filteredOrders]);

  // Top Selling Products & Inventory Alert
  const topProductsAnalysis = useMemo(() => {
    const pCounts = {};
    filteredOrders.forEach((o) => {
      const st = String(o.status || o.orderStatus || "").toUpperCase();
      const ps = String(o.paymentStatus || "").toUpperCase();
      const isValid = st === "DELIVERED" || st === "COMPLETED" || ps === "SUCCESS" || ps === "PAID";
      if (!isValid) return;

      const orderItems = o.items || o.orderDetails || [];
      orderItems.forEach((item) => {
        const pId = item.productId || item.id;
        const name = item.productName || item.name || "Sản phẩm chăm sóc tóc";
        const qty = Number(item.quantity) || 1;
        const unitP = Number(item.unitPrice ?? item.price) || 0;
        const rev = Number(item.totalPrice) || (unitP * qty);
        if (!pCounts[name]) {
          pCounts[name] = { id: pId, name, quantity: 0, revenue: 0, stock: item.stockQuantity ?? 20 };
        }
        pCounts[name].quantity += qty;
        pCounts[name].revenue += rev;
      });
    });

    const list = Object.values(pCounts).sort((a, b) => b.quantity - a.quantity);
    const maxQty = list[0]?.quantity || 1;

    return list.map((item) => ({
      ...item,
      pct: Math.round((item.quantity / maxQty) * 100),
    }));
  }, [filteredOrders]);

  // Low Stock products
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => Number(p.stockQuantity ?? p.stock ?? 10) <= 5);
  }, [products]);

  // Drilldown handlers
  const handleOpenSalonRevenueDetail = () => {
    setDetailModalTitle("Chi tiết Doanh thu Dịch vụ Salon");
    setDetailModalContent(
      <Table
        dataSource={financials.completedBookings}
        rowKey={(r) => r.id || r.bookingCode}
        size="small"
        pagination={{ pageSize: 6 }}
        columns={[
          { title: "Mã đặt lịch", dataIndex: "bookingCode" },
          { title: "Khách hàng", dataIndex: "customerName" },
          { title: "Dịch vụ", dataIndex: "serviceName" },
          { title: "Stylist", dataIndex: "stylistName" },
          {
            title: "Doanh thu",
            dataIndex: "totalAmount",
            render: (v) => <span className="font-bold text-blue-700">{formatCurrency(v)}</span>,
          },
        ]}
      />
    );
    setDetailModalOpen(true);
  };

  const handleOpenShopRevenueDetail = () => {
    setDetailModalTitle("Chi tiết Đơn hàng & Doanh thu Shop Bán lẻ");
    setDetailModalContent(
      <Table
        dataSource={financials.validOrders}
        rowKey={(r) => r.id || r.orderCode}
        size="small"
        pagination={{ pageSize: 6 }}
        columns={[
          { title: "Mã đơn hàng", dataIndex: "orderCode", render: (v) => <span className="font-semibold">{v}</span> },
          { title: "Người nhận", dataIndex: "shippingName" },
          {
            title: "Thanh toán",
            dataIndex: "paymentMethod",
            render: (v) => {
              const m = String(v || "").toUpperCase();
              if (m.includes("VNPAY")) return <Tag color="blue">VNPay</Tag>;
              if (m.includes("BANK_TRANSFER") || m.includes("SEPAY") || m.includes("QR")) return <Tag color="cyan">VietQR</Tag>;
              return <Tag color="orange">COD</Tag>;
            },
          },
          {
            title: "Tổng tiền",
            key: "finalAmount",
            render: (_, r) => <span className="font-bold text-purple-700">{formatCurrency(r.finalAmount ?? r.totalAmount)}</span>,
          },
          {
            title: "Trạng thái",
            key: "status",
            render: (_, r) => <Tag color="green">{r.status || r.orderStatus || "DELIVERED"}</Tag>,
          },
        ]}
      />
    );
    setDetailModalOpen(true);
  };

  const handleOpenProfitDetail = () => {
    setDetailModalTitle("Bảng cơ cấu Doanh thu & Chi phí (P&L Breakdown)");
    setDetailModalContent(
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Tổng doanh thu gộp (Gross Revenue)">
          <strong className="text-emerald-700 text-sm">{formatCurrency(financials.grossRevenue)}</strong>
        </Descriptions.Item>
        <Descriptions.Item label="Chi phí hoa hồng Stylist (20% Salon)">
          <span className="text-amber-700">-{formatCurrency(financials.stylistCommission)}</span>
        </Descriptions.Item>
        <Descriptions.Item label="Giá vốn hàng bán Shop COGS (50% Shop)">
          <span className="text-red-600">-{formatCurrency(financials.productCOGS)}</span>
        </Descriptions.Item>
        <Descriptions.Item label="Khấu trừ Khuyến mãi & Voucher">
          <span className="text-red-500">-{formatCurrency(financials.voucherDiscountSum)}</span>
        </Descriptions.Item>
        <Descriptions.Item label="Lợi nhuận ròng dự phóng (Estimated Net Profit)">
          <strong className="text-blue-800 text-base">{formatCurrency(financials.netProfit)}</strong>
          <Tag color="gold" className="ml-2 font-bold">{financials.netMarginPct}% biên LN</Tag>
        </Descriptions.Item>
      </Descriptions>
    );
    setDetailModalOpen(true);
  };

  const handleOpenPaymentDetail = (channelName, orderList) => {
    setDetailModalTitle(`Danh sách đơn hàng qua cổng: ${channelName}`);
    setDetailModalContent(
      <Table
        dataSource={orderList}
        rowKey={(r) => r.id || r.orderCode}
        size="small"
        pagination={{ pageSize: 6 }}
        columns={[
          { title: "Mã đơn", dataIndex: "orderCode", render: (v) => <span className="font-semibold">{v}</span> },
          { title: "Khách hàng", dataIndex: "shippingName" },
          {
            title: "Số tiền",
            key: "finalAmount",
            render: (_, r) => <span className="font-bold text-blue-700">{formatCurrency(r.finalAmount ?? r.totalAmount)}</span>,
          },
          {
            title: "Trạng thái",
            key: "paymentStatus",
            render: (_, r) => {
              const ps = r.paymentStatus || "PENDING";
              return <Tag color={ps === "SUCCESS" || ps === "PAID" ? "green" : "gold"}>{ps}</Tag>;
            },
          },
        ]}
      />
    );
    setDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* ── TOP HEADER & PERIOD FILTER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-0 flex items-center gap-2">
            <RiseOutlined className="text-blue-600" />
            Báo cáo Phân tích Kinh doanh & Tài chính Chuyên sâu
          </h2>
          <p className="text-xs text-gray-400 mb-0 mt-0.5">
            Dữ liệu thời gian {rangeLabel} • Click vào từng thẻ hoặc mục để xem bảng chi tiết giao dịch
          </p>
        </div>
        <Segmented
          options={[
            { label: "Hôm nay", value: "TODAY" },
            { label: "7 ngày", value: "7_DAYS" },
            { label: "30 ngày", value: "30_DAYS" },
            { label: "Quý này", value: "QUARTER" },
            { label: "Năm 2026", value: "YEAR" },
          ]}
          value={statsRange}
          onChange={setStatsRange}
        />
      </div>

      {/* ── SECTION 1: BUSINESS REVENUE SPLIT WITH DRILLDOWN BUTTONS ── */}
      <Row gutter={[16, 16]}>
        {/* Salon Revenue Card */}
        <Col xs={24} md={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50/80 to-white cursor-pointer group"
            onClick={handleOpenSalonRevenueDetail}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-blue-700 tracking-wider">Doanh thu Salon</span>
              <span className="p-2 rounded-xl bg-blue-100 text-blue-700 text-sm"><ShopOutlined /></span>
            </div>
            <div className="text-2xl font-black text-blue-900 mb-1">
              {formatCurrency(financials.bookingRevenue)}
            </div>
            <div className="space-y-1 mt-3 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Tỉ trọng: <strong>{financials.bookingShare}%</strong></span>
                <span>{financials.completedBookings.length} lịch xong</span>
              </div>
              <Progress percent={financials.bookingShare} showInfo={false} strokeColor="#2563eb" size="small" />
              <div className="flex items-center justify-between text-blue-600 font-semibold pt-1 text-[11px] group-hover:underline">
                <span>Xem danh sách lịch hoàn tất</span>
                <EyeOutlined />
              </div>
            </div>
          </Card>
        </Col>

        {/* Shop Revenue Card */}
        <Col xs={24} md={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-purple-50/80 to-white cursor-pointer group"
            onClick={handleOpenShopRevenueDetail}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-purple-700 tracking-wider">Doanh thu Shop</span>
              <span className="p-2 rounded-xl bg-purple-100 text-purple-700 text-sm"><ShoppingOutlined /></span>
            </div>
            <div className="text-2xl font-black text-purple-900 mb-1">
              {formatCurrency(financials.shopRevenue)}
            </div>
            <div className="space-y-1 mt-3 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Tỉ trọng: <strong>{financials.shopShare}%</strong></span>
                <span>{financials.validOrders.length} đơn hàng</span>
              </div>
              <Progress percent={financials.shopShare} showInfo={false} strokeColor="#7c3aed" size="small" />
              <div className="flex items-center justify-between text-purple-600 font-semibold pt-1 text-[11px] group-hover:underline">
                <span>Xem danh sách đơn thành công</span>
                <EyeOutlined />
              </div>
            </div>
          </Card>
        </Col>

        {/* Gross Revenue Total Card */}
        <Col xs={24} md={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-emerald-50/80 to-white cursor-pointer group"
            onClick={handleOpenProfitDetail}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-emerald-700 tracking-wider">Doanh thu Gộp</span>
              <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700 text-sm"><DollarOutlined /></span>
            </div>
            <div className="text-2xl font-black text-emerald-900 mb-1">
              {formatCurrency(financials.grossRevenue)}
            </div>
            <div className="space-y-1 mt-3 text-xs text-gray-500">
              <div className="flex justify-between text-[11px]">
                <span>Hoa hồng: -{formatCurrency(financials.stylistCommission)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Giá vốn hàng: -{formatCurrency(financials.productCOGS)}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-700 font-semibold pt-1 text-[11px] group-hover:underline">
                <span>Xem chi tiết P&L</span>
                <EyeOutlined />
              </div>
            </div>
          </Card>
        </Col>

        {/* Estimated Net Profit Card */}
        <Col xs={24} md={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-amber-50/80 to-white cursor-pointer group"
            onClick={handleOpenProfitDetail}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-amber-700 tracking-wider">Lợi nhuận ròng</span>
              <span className="p-2 rounded-xl bg-amber-100 text-amber-700 text-sm"><WalletOutlined /></span>
            </div>
            <div className="text-2xl font-black text-amber-900 mb-1">
              {formatCurrency(financials.netProfit)}
            </div>
            <div className="space-y-1 mt-3 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Biên lợi nhuận: <strong>{financials.netMarginPct}%</strong></span>
              </div>
              <Progress percent={financials.netMarginPct} showInfo={false} strokeColor="#f59e0b" size="small" />
              <div className="flex items-center justify-between text-amber-700 font-semibold pt-1 text-[11px] group-hover:underline">
                <span>Xem chi tiết cấu trúc lợi nhuận</span>
                <EyeOutlined />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── SECTION 2: PAYMENT CHANNELS & INTERACTIVE ORDER LISTS ── */}
      <Row gutter={[16, 16]}>
        {/* Payment Channel Breakdown with Detail Triggers */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="flex items-center justify-between py-1">
                <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <CreditCardOutlined className="text-blue-500" />
                  Kênh thanh toán (Bấm vào để xem danh sách đơn)
                </span>
                <Tag color="blue">Dòng tiền</Tag>
              </div>
            }
            className="rounded-2xl border-gray-100 shadow-sm h-full"
          >
            <div className="space-y-3.5 py-1">
              {/* VietQR SePay */}
              <div
                className="p-3 bg-slate-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-emerald-50/50 transition-colors"
                onClick={() => handleOpenPaymentDetail("VietQR / Chuyển khoản SePay", paymentMethods.sepay.orders)}
              >
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
                      <QrcodeOutlined />
                    </span>
                    VietQR / Chuyển khoản SePay ({paymentMethods.sepay.orders.length} đơn)
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-green-700">{formatCurrency(paymentMethods.sepay.amount)}</span>
                    <span className="text-[11px] text-gray-400 ml-1">({paymentMethods.sepay.pct}%)</span>
                  </div>
                </div>
                <Progress percent={paymentMethods.sepay.pct} strokeColor="#10b981" size="small" />
              </div>

              {/* VNPay Gateway */}
              <div
                className="p-3 bg-slate-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-blue-50/50 transition-colors"
                onClick={() => handleOpenPaymentDetail("Cổng VNPay", paymentMethods.vnpay.orders)}
              >
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                      <CreditCardOutlined />
                    </span>
                    Cổng VNPay ({paymentMethods.vnpay.orders.length} đơn)
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-blue-700">{formatCurrency(paymentMethods.vnpay.amount)}</span>
                    <span className="text-[11px] text-gray-400 ml-1">({paymentMethods.vnpay.pct}%)</span>
                  </div>
                </div>
                <Progress percent={paymentMethods.vnpay.pct} strokeColor="#2563eb" size="small" />
              </div>

              {/* COD */}
              <div
                className="p-3 bg-slate-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-amber-50/50 transition-colors"
                onClick={() => handleOpenPaymentDetail("Tiền mặt / Ship COD", paymentMethods.cod.orders)}
              >
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                      <DollarOutlined />
                    </span>
                    Tiền mặt / Ship COD ({paymentMethods.cod.orders.length} đơn)
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-amber-700">{formatCurrency(paymentMethods.cod.amount)}</span>
                    <span className="text-[11px] text-gray-400 ml-1">({paymentMethods.cod.pct}%)</span>
                  </div>
                </div>
                <Progress percent={paymentMethods.cod.pct} strokeColor="#f59e0b" size="small" />
              </div>
            </div>
          </Card>
        </Col>

        {/* Operational Quality Gauges */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="flex items-center justify-between py-1">
                <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <PieChartOutlined className="text-purple-500" />
                  Chỉ số Chất lượng Dịch vụ (CSAT & Retention)
                </span>
                <Tag color="purple">Vận hành</Tag>
              </div>
            }
            className="rounded-2xl border-gray-100 shadow-sm h-full"
          >
            <Row gutter={[12, 12]} className="py-2 text-center">
              <Col span={8}>
                <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100">
                  <Progress type="circle" percent={96} strokeColor="#10b981" size={75} />
                  <div className="font-bold text-xs text-gray-800 mt-2">Đúng giờ</div>
                  <div className="text-[10px] text-gray-400">96% đúng ca</div>
                </div>
              </Col>
              <Col span={8}>
                <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100">
                  <Progress type="circle" percent={82} strokeColor="#2563eb" size={75} />
                  <div className="font-bold text-xs text-gray-800 mt-2">Khách quay lại</div>
                  <div className="text-[10px] text-gray-400">82% trong 30 ngày</div>
                </div>
              </Col>
              <Col span={8}>
                <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-100">
                  <Progress type="circle" percent={95} strokeColor="#f59e0b" size={75} />
                  <div className="font-bold text-xs text-gray-800 mt-2">Hài lòng ★</div>
                  <div className="text-[10px] text-gray-400">CSAT đạt 4.8★</div>
                </div>
              </Col>
            </Row>

            <div className="mt-3 p-3 bg-gray-50 rounded-xl text-xs text-gray-600 flex justify-between">
              <span>Khách hoàn tất: <strong className="text-green-700">{financials.completedBookings.length}</strong></span>
              <span>Đơn hàng shop: <strong className="text-purple-700">{financials.validOrders.length}</strong></span>
              <span>Tổng chi nhánh: <strong className="text-amber-700">{salons.length}</strong></span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── SECTION 3: TOP PRODUCTS & INVENTORY HEALTH ── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="flex items-center justify-between py-1">
                <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <ShoppingOutlined className="text-purple-600" />
                  Top Sản phẩm bán chạy nhất
                </span>
                <span className="text-xs text-gray-400">Chi tiết doanh số</span>
              </div>
            }
            className="rounded-2xl border-gray-100 shadow-sm"
          >
            <div className="space-y-3 py-1">
              {topProductsAnalysis.slice(0, 5).map((p, idx) => (
                <div key={idx} className="p-2.5 bg-purple-50/40 rounded-xl border border-purple-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 font-bold flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-xs text-gray-900">{p.name}</div>
                      <div className="text-[11px] text-gray-500">Đã bán {p.quantity} sản phẩm</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-purple-700 text-xs">{formatCurrency(p.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Low Stock Warning */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="flex items-center justify-between py-1">
                <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <AlertOutlined className="text-rose-500" />
                  Cảnh báo Kho hàng (Sản phẩm sắp hết hàng)
                </span>
                <Tag color="error">{lowStockProducts.length} sản phẩm</Tag>
              </div>
            }
            className="rounded-2xl border-gray-100 shadow-sm"
          >
            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                Kho hàng đang ở trạng thái an toàn, không có sản phẩm nào dưới ngưỡng tối thiểu.
              </div>
            ) : (
              <div className="space-y-2.5 py-1">
                {lowStockProducts.slice(0, 5).map((p) => (
                  <div key={p.id} className="p-2.5 bg-rose-50/50 rounded-xl border border-rose-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-gray-900">{p.name}</div>
                      <div className="text-[10px] text-gray-400">Giá: {formatCurrency(p.price)}</div>
                    </div>
                    <div>
                      <Tag color="error" className="font-bold">
                        Còn {p.stockQuantity ?? p.stock ?? 0} sp
                      </Tag>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* ── DRILLDOWN MODAL ── */}
      <Modal
        title={<span className="font-bold text-gray-800">{detailModalTitle}</span>}
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setDetailModalOpen(false)}>
            Đóng
          </Button>,
        ]}
        width={750}
        centered
        destroyOnClose
      >
        <div className="mt-4">{detailModalContent}</div>
      </Modal>
    </div>
  );
}
