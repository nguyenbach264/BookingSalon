import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Row,
  Col,
  Card,
  Statistic,
  Select,
  Table,
  Button,
  Tag,
  Progress,
  Tooltip,
  Avatar,
  Badge,
} from "antd";
import {
  CalendarOutlined,
  DollarOutlined,
  TeamOutlined,
  ShopOutlined,
  ArrowUpOutlined,
  RiseOutlined,
  BarChartOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  ShoppingOutlined,
  FireOutlined,
  RightOutlined,
  AppstoreOutlined,
  GiftOutlined,
} from "@ant-design/icons";

const { Option } = Select;

export default function AdminOverview({
  totalBookingsCount = 0,
  pendingCount = 0,
  confirmedCount = 0,
  completedCount = 0,
  totalRevenue = 0,
  formatCurrency,
  users = [],
  salons = [],
  stylists = [],
  services = [],
  orders = [],
  adminTrendPeriod = "week",
  setAdminTrendPeriod,
  adminTrendMetrics = { revenue: 0, bookingRevenue: 0, orderRevenue: 0, totalTransactions: 0, chartData: [] },
  completionRate = 0,
  bookings = [],
  BOOKING_COLUMNS = [],
  setActiveSection,
}) {
  const navigate = useNavigate();

  // Top services across chain
  const topServices = useMemo(() => {
    const sMap = {};
    bookings.forEach((b) => {
      const name = b.serviceName || b.serviceOfferingName || "Dịch vụ làm tóc";
      if (!sMap[name]) sMap[name] = { name, count: 0, revenue: 0 };
      sMap[name].count += 1;
      if (b.status === "COMPLETED") sMap[name].revenue += Number(b.totalAmount) || 0;
    });
    return Object.values(sMap).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [bookings]);

  // Top products from orders
  const topProducts = useMemo(() => {
    const pMap = {};
    orders.forEach((o) => {
      const st = String(o.status || o.orderStatus || "").toUpperCase();
      const ps = String(o.paymentStatus || "").toUpperCase();
      const isValid = st === "DELIVERED" || st === "COMPLETED" || ps === "SUCCESS" || ps === "PAID";
      if (!isValid) return;

      const orderItems = o.items || o.orderDetails || [];
      orderItems.forEach((item) => {
        const name = item.productName || item.name || "Sản phẩm";
        const qty = Number(item.quantity) || 1;
        const unitP = Number(item.unitPrice ?? item.price) || 0;
        const rev = Number(item.totalPrice) || (unitP * qty);
        if (!pMap[name]) pMap[name] = { name, quantity: 0, revenue: 0 };
        pMap[name].quantity += qty;
        pMap[name].revenue += rev;
      });
    });
    return Object.values(pMap).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [orders]);

  // Top stylists
  const topStylists = useMemo(() => {
    return [...stylists]
      .sort((a, b) => (b.totalServedBookings || 0) - (a.totalServedBookings || 0))
      .slice(0, 5);
  }, [stylists]);

  return (
    <div className="space-y-6">
      {/* ── TOP STATS CARDS WITH DIRECT LINKS ── */}
      <Row gutter={[16, 16]}>
        {/* Salon Card */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-amber-50/70 to-white group"
            onClick={() => setActiveSection("salons")}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-amber-700 tracking-wider">Hệ thống Salon</span>
              <span className="p-2 rounded-xl bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <ShopOutlined />
              </span>
            </div>
            <Statistic
              value={salons.length}
              suffix={<span className="text-xs text-gray-400 font-normal">chi nhánh</span>}
              valueStyle={{ fontWeight: 900, color: "#78350f" }}
            />
            <div className="mt-3 flex items-center justify-between text-xs text-amber-600 font-semibold">
              <span>Xem quản lý salon</span>
              <RightOutlined className="text-[10px] group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </Col>

        {/* Stylist Card */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-purple-50/70 to-white group"
            onClick={() => setActiveSection("stylists")}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-purple-700 tracking-wider">Đội ngũ Stylist</span>
              <span className="p-2 rounded-xl bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <TeamOutlined />
              </span>
            </div>
            <Statistic
              value={stylists.length}
              suffix={<span className="text-xs text-gray-400 font-normal">thợ chính</span>}
              valueStyle={{ fontWeight: 900, color: "#581c87" }}
            />
            <div className="mt-3 flex items-center justify-between text-xs text-purple-600 font-semibold">
              <span>Xem danh sách thợ</span>
              <RightOutlined className="text-[10px] group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </Col>

        {/* Services Card */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-blue-50/70 to-white group"
            onClick={() => setActiveSection("services")}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-blue-700 tracking-wider">Dịch vụ & Combo</span>
              <span className="p-2 rounded-xl bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <AppstoreOutlined />
              </span>
            </div>
            <Statistic
              value={services.length}
              suffix={<span className="text-xs text-gray-400 font-normal">gói dịch vụ</span>}
              valueStyle={{ fontWeight: 900, color: "#1e3a8a" }}
            />
            <div className="mt-3 flex items-center justify-between text-xs text-blue-600 font-semibold">
              <span>Quản lý bảng giá</span>
              <RightOutlined className="text-[10px] group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </Col>

        {/* Bookings Card */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-emerald-50/70 to-white group"
            onClick={() => setActiveSection("bookings")}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-emerald-700 tracking-wider">Lịch hẹn khách hàng</span>
              <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <CalendarOutlined />
              </span>
            </div>
            <Statistic
              value={totalBookingsCount}
              suffix={<span className="text-xs text-gray-400 font-normal">lượt hẹn</span>}
              valueStyle={{ fontWeight: 900, color: "#065f46" }}
            />
            <div className="mt-3 flex items-center justify-between text-xs text-emerald-600 font-semibold">
              <span>Xem lịch đặt ({pendingCount} chờ)</span>
              <RightOutlined className="text-[10px] group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── SECTION: REVENUE OVERVIEW & LINK TO DETAILED ANALYTICS ── */}
      <Card
        className="rounded-2xl border-gray-100 shadow-sm"
        title={
          <div className="flex items-center justify-between py-1">
            <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <RiseOutlined className="text-blue-500" />
              Tổng quan Doanh thu & Giao dịch toàn chuỗi
            </span>
            <Button
              type="primary"
              size="small"
              icon={<BarChartOutlined />}
              onClick={() => setActiveSection("stats")}
              className="bg-blue-600 rounded-lg text-xs"
            >
              Xem Phân tích & Báo cáo chi tiết
            </Button>
          </div>
        }
      >
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={12} sm={6}>
            <div
              className="bg-blue-50/70 rounded-xl p-3 text-center border border-blue-100 cursor-pointer hover:bg-blue-100/70 transition-colors"
              onClick={() => setActiveSection("stats")}
            >
              <div className="text-lg">💰</div>
              <div className="text-base font-black text-blue-800">{formatCurrency(adminTrendMetrics.revenue)}</div>
              <div className="text-[11px] text-gray-500">Tổng doanh thu kỳ</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div
              className="bg-sky-50/70 rounded-xl p-3 text-center border border-sky-100 cursor-pointer hover:bg-sky-100/70 transition-colors"
              onClick={() => setActiveSection("bookings")}
            >
              <div className="text-lg">✂️</div>
              <div className="text-base font-black text-sky-800">{formatCurrency(adminTrendMetrics.bookingRevenue)}</div>
              <div className="text-[11px] text-gray-500">Dịch vụ Salon ({completedCount} khách)</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div
              className="bg-purple-50/70 rounded-xl p-3 text-center border border-purple-100 cursor-pointer hover:bg-purple-100/70 transition-colors"
              onClick={() => setActiveSection("orders")}
            >
              <div className="text-lg">🛍️</div>
              <div className="text-base font-black text-purple-800">{formatCurrency(adminTrendMetrics.orderRevenue)}</div>
              <div className="text-[11px] text-gray-500">Shop Sản phẩm ({orders.length} đơn)</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div
              className="bg-emerald-50/70 rounded-xl p-3 text-center border border-emerald-100 cursor-pointer hover:bg-emerald-100/70 transition-colors"
              onClick={() => setActiveSection("users")}
            >
              <div className="text-lg">👥</div>
              <div className="text-base font-black text-emerald-800">{users.length} tài khoản</div>
              <div className="text-[11px] text-gray-500">Khách hàng thành viên</div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* ── SECTION: SALONS LIST & TOP ENTITIES WITH QUICK NAVIGATION ── */}
      <Row gutter={[16, 16]}>
        {/* Salon Branch Performance */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="flex items-center justify-between py-1">
                <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <ShopOutlined className="text-amber-500" />
                  Hiệu suất các chi nhánh Salon
                </span>
                <Button type="link" size="small" onClick={() => setActiveSection("salons")}>
                  Quản lý salon ({salons.length}) <RightOutlined className="text-[10px]" />
                </Button>
              </div>
            }
            className="rounded-2xl border-gray-100 shadow-sm h-full"
          >
            <div className="space-y-3 py-1">
              {salons.map((salon) => {
                const sBookings = bookings.filter((b) => b.salonId === salon.id);
                const sRev = sBookings
                  .filter((b) => b.status === "COMPLETED")
                  .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
                const sStylists = stylists.filter((s) => s.salonId === salon.id);

                return (
                  <div
                    key={salon.id}
                    className="p-3 bg-slate-50/80 rounded-xl border border-gray-100 flex items-center justify-between hover:bg-amber-50/40 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/admin/salons/${salon.id}`)}
                  >
                    <div>
                      <div className="font-bold text-xs text-gray-900 group-hover:text-amber-700 transition-colors flex items-center gap-1.5">
                        {salon.salonName}
                        <Tag color={salon.enabled ? "success" : "error"} className="text-[10px] m-0">
                          {salon.enabled ? "Mở cửa" : "Tạm đóng"}
                        </Tag>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {salon.city} • {sStylists.length} thợ • {sBookings.length} lịch đặt
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-extrabold text-blue-700 text-xs">{formatCurrency(sRev)}</div>
                      <span className="text-[11px] text-amber-600 font-semibold group-hover:underline flex items-center gap-0.5 justify-end mt-0.5">
                        Xem chi tiết cơ sở <RightOutlined className="text-[9px]" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>

        {/* Top Stylists */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="flex items-center justify-between py-1">
                <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <TeamOutlined className="text-purple-500" />
                  Stylist tiêu biểu trong hệ thống
                </span>
                <Button type="link" size="small" onClick={() => setActiveSection("stylists")}>
                  Quản lý Stylist ({stylists.length}) <RightOutlined className="text-[10px]" />
                </Button>
              </div>
            }
            className="rounded-2xl border-gray-100 shadow-sm h-full"
          >
            <div className="space-y-3 py-1">
              {topStylists.map((st, idx) => (
                <div
                  key={st.id || idx}
                  className="p-2.5 bg-gray-50/70 rounded-xl border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-purple-50/50 transition-colors"
                  onClick={() => setActiveSection("stylists")}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      idx === 0 ? "bg-amber-400 text-black" : "bg-gray-200 text-gray-600"
                    }`}>
                      {idx + 1}
                    </span>
                    <Avatar src={st.avatarUrl} size={32} icon={<UserOutlined />} />
                    <div>
                      <div className="font-bold text-xs text-gray-900">{st.fullName}</div>
                      <div className="text-[11px] text-gray-400">{st.salonName || "Chi nhánh chính"}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-xs text-amber-600">
                      ★ {Number(st.ratingAverage || 4.9).toFixed(1)}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {st.totalServedBookings || 0} lượt cắt
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── SECTION: TOP SERVICES & TOP PRODUCTS WITH LINKS ── */}
      <Row gutter={[16, 16]}>
        {/* Top Services */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="flex items-center justify-between py-1">
                <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <FireOutlined className="text-orange-500" />
                  Dịch vụ được đặt nhiều nhất
                </span>
                <Button type="link" size="small" onClick={() => setActiveSection("services")}>
                  Quản lý Dịch vụ <RightOutlined className="text-[10px]" />
                </Button>
              </div>
            }
            className="rounded-2xl border-gray-100 shadow-sm"
          >
            <div className="space-y-3 py-1">
              {topServices.map((srv, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-slate-50/80 rounded-xl border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-blue-50/50 transition-colors"
                  onClick={() => setActiveSection("services")}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-xs text-gray-800">{srv.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs text-blue-700">{srv.count} lượt</span>
                    <span className="text-[11px] text-gray-400 ml-1.5">({formatCurrency(srv.revenue)})</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Top Products */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="flex items-center justify-between py-1">
                <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <ShoppingOutlined className="text-purple-600" />
                  Sản phẩm Shop bán chạy
                </span>
                <Button type="link" size="small" onClick={() => setActiveSection("products")}>
                  Quản lý Sản phẩm <RightOutlined className="text-[10px]" />
                </Button>
              </div>
            }
            className="rounded-2xl border-gray-100 shadow-sm"
          >
            <div className="space-y-3 py-1">
              {topProducts.length === 0 ? (
                <div className="py-6 text-center text-gray-400 text-xs">Chưa có dữ liệu bán hàng Shop</div>
              ) : (
                topProducts.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-purple-50/40 rounded-xl border border-purple-100 flex items-center justify-between cursor-pointer hover:bg-purple-100/50 transition-colors"
                    onClick={() => setActiveSection("products")}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-xs text-gray-800">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-xs text-purple-700">Đã bán {p.quantity}</span>
                      <span className="text-[11px] text-gray-400 ml-1.5">({formatCurrency(p.revenue)})</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
