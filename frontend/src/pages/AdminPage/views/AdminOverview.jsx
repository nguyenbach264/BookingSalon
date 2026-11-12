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
          <div
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between h-full"
            onClick={() => setActiveSection("salons")}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">Hệ thống Salon</span>
                <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center text-sm group-hover:bg-amber-500 group-hover:text-white transition-all shadow-xs">
                  <ShopOutlined />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight font-sans">
                  {salons.length}
                </span>
                <span className="text-xs font-semibold text-slate-400">chi nhánh</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-amber-600 font-bold group-hover:text-amber-700">
              <span>Xem quản lý salon</span>
              <RightOutlined className="text-[10px] group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Col>

        {/* Stylist Card */}
        <Col xs={24} sm={12} lg={6}>
          <div
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between h-full"
            onClick={() => setActiveSection("stylists")}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">Đội ngũ Stylist</span>
                <span className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center text-sm group-hover:bg-purple-600 group-hover:text-white transition-all shadow-xs">
                  <TeamOutlined />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight font-sans">
                  {stylists.length}
                </span>
                <span className="text-xs font-semibold text-slate-400">thợ chính</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-purple-600 font-bold group-hover:text-purple-700">
              <span>Xem danh sách thợ</span>
              <RightOutlined className="text-[10px] group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Col>

        {/* Services Card */}
        <Col xs={24} sm={12} lg={6}>
          <div
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between h-full"
            onClick={() => setActiveSection("services")}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">Dịch vụ & Combo</span>
                <span className="w-9 h-9 rounded-xl bg-blue-50 text-[#0099FF] border border-blue-200/60 flex items-center justify-center text-sm group-hover:bg-[#0099FF] group-hover:text-white transition-all shadow-xs">
                  <AppstoreOutlined />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight font-sans">
                  {services.length}
                </span>
                <span className="text-xs font-semibold text-slate-400">gói dịch vụ</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#0099FF] font-bold group-hover:text-[#0080d9]">
              <span>Quản lý bảng giá</span>
              <RightOutlined className="text-[10px] group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Col>

        {/* Bookings Card */}
        <Col xs={24} sm={12} lg={6}>
          <div
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between h-full"
            onClick={() => setActiveSection("bookings")}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">Lịch hẹn khách hàng</span>
                <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center text-sm group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
                  <CalendarOutlined />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight font-sans">
                  {totalBookingsCount}
                </span>
                <span className="text-xs font-semibold text-slate-400">lượt hẹn</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-600 font-bold group-hover:text-emerald-700">
              <span>Xem lịch đặt ({pendingCount} chờ)</span>
              <RightOutlined className="text-[10px] group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Col>
      </Row>

      {/* ── SECTION: REVENUE OVERVIEW & LINK TO DETAILED ANALYTICS ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0099FF] border border-blue-200/60 flex items-center justify-center text-sm shadow-xs">
              <RiseOutlined />
            </div>
            <span className="font-extrabold text-slate-900 text-sm tracking-tight">
              Tổng quan Doanh thu & Giao dịch toàn chuỗi
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveSection("stats")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0099FF] hover:bg-[#0080d9] text-white font-bold text-xs shadow-xs hover:shadow transition-all self-start sm:self-auto cursor-pointer"
          >
            <BarChartOutlined />
            <span>Xem Phân tích & Báo cáo chi tiết</span>
          </button>
        </div>

        <Row gutter={[14, 14]} className="mt-4">
          <Col xs={12} sm={6}>
            <div
              className="bg-slate-50/70 hover:bg-blue-50/40 rounded-xl p-3.5 border border-slate-200/70 hover:border-[#0099FF]/40 cursor-pointer transition-all group"
              onClick={() => setActiveSection("stats")}
            >
              <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-[#0099FF] flex items-center justify-center text-sm mb-2 shadow-xs group-hover:scale-105 transition-transform">
                💰
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {formatCurrency(adminTrendMetrics.revenue)}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">Tổng doanh thu kỳ</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div
              className="bg-slate-50/70 hover:bg-sky-50/40 rounded-xl p-3.5 border border-slate-200/70 hover:border-sky-300 cursor-pointer transition-all group"
              onClick={() => setActiveSection("bookings")}
            >
              <div className="w-7 h-7 rounded-lg bg-sky-100/70 text-sky-600 flex items-center justify-center text-sm mb-2 shadow-xs group-hover:scale-105 transition-transform">
                ✂️
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {formatCurrency(adminTrendMetrics.bookingRevenue)}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                Dịch vụ Salon ({completedCount} khách)
              </div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div
              className="bg-slate-50/70 hover:bg-purple-50/40 rounded-xl p-3.5 border border-slate-200/70 hover:border-purple-300 cursor-pointer transition-all group"
              onClick={() => setActiveSection("orders")}
            >
              <div className="w-7 h-7 rounded-lg bg-purple-100/70 text-purple-600 flex items-center justify-center text-sm mb-2 shadow-xs group-hover:scale-105 transition-transform">
                🛍️
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {formatCurrency(adminTrendMetrics.orderRevenue)}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                Shop Sản phẩm ({orders.length} đơn)
              </div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div
              className="bg-slate-50/70 hover:bg-emerald-50/40 rounded-xl p-3.5 border border-slate-200/70 hover:border-emerald-300 cursor-pointer transition-all group"
              onClick={() => setActiveSection("users")}
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-emerald-600 flex items-center justify-center text-sm mb-2 shadow-xs group-hover:scale-105 transition-transform">
                👥
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {users.length} tài khoản
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">Khách hàng thành viên</div>
            </div>
          </Col>
        </Row>
      </div>

      {/* ── SECTION: SALONS LIST & TOP ENTITIES WITH QUICK NAVIGATION ── */}
      <Row gutter={[16, 16]}>
        {/* Salon Branch Performance */}
        <Col xs={24} lg={12}>
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3">
                <span className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center text-xs">
                    <ShopOutlined />
                  </span>
                  Hiệu suất các chi nhánh Salon
                </span>
                <button
                  type="button"
                  onClick={() => setActiveSection("salons")}
                  className="text-xs font-bold text-[#0099FF] hover:text-[#0080d9] inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  Quản lý salon ({salons.length}) <RightOutlined className="text-[10px]" />
                </button>
              </div>

              <div className="space-y-2.5">
                {salons.map((salon) => {
                  const sBookings = bookings.filter((b) => b.salonId === salon.id);
                  const sRev = sBookings
                    .filter((b) => b.status === "COMPLETED")
                    .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
                  const sStylists = stylists.filter((s) => s.salonId === salon.id);

                  return (
                    <div
                      key={salon.id}
                      className="p-3 bg-slate-50/70 hover:bg-white rounded-xl border border-slate-200/70 hover:border-[#0099FF]/40 hover:shadow-xs flex items-center justify-between transition-all cursor-pointer group"
                      onClick={() => navigate(`/admin/salons/${salon.id}`)}
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900 group-hover:text-[#0099FF] transition-colors flex items-center gap-2">
                          <span>{salon.salonName}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            salon.enabled
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                              : "bg-rose-50 text-rose-700 border-rose-200/70"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${salon.enabled ? "bg-emerald-500" : "bg-rose-500"}`} />
                            {salon.enabled ? "Mở cửa" : "Tạm đóng"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium mt-1">
                          {salon.city} • {sStylists.length} thợ • {sBookings.length} lịch đặt
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-black text-xs text-[#0099FF]">{formatCurrency(sRev)}</div>
                        <span className="text-[11px] text-slate-500 group-hover:text-[#0099FF] font-semibold flex items-center gap-0.5 justify-end mt-1 transition-colors">
                          Xem chi tiết cơ sở <RightOutlined className="text-[9px] group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Col>

        {/* Top Stylists */}
        <Col xs={24} lg={12}>
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3">
                <span className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center text-xs">
                    <TeamOutlined />
                  </span>
                  Stylist tiêu biểu trong hệ thống
                </span>
                <button
                  type="button"
                  onClick={() => setActiveSection("stylists")}
                  className="text-xs font-bold text-[#0099FF] hover:text-[#0080d9] inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  Quản lý Stylist ({stylists.length}) <RightOutlined className="text-[10px]" />
                </button>
              </div>

              <div className="space-y-2.5">
                {topStylists.map((st, idx) => (
                  <div
                    key={st.id || idx}
                    className="p-2.5 bg-slate-50/70 hover:bg-white rounded-xl border border-slate-200/70 hover:border-purple-300 hover:shadow-xs flex items-center justify-between cursor-pointer transition-all group"
                    onClick={() => setActiveSection("stylists")}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[11px] shadow-2xs ${
                        idx === 0
                          ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-white"
                          : idx === 1
                          ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white"
                          : idx === 2
                          ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {idx + 1}
                      </span>
                      <Avatar
                        src={st.avatarUrl}
                        size={34}
                        icon={<UserOutlined />}
                        className="ring-1 ring-slate-200 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-xs text-slate-900 group-hover:text-purple-700 transition-colors">
                          {st.fullName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {st.salonName || "Chi nhánh chính"}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-xs border border-amber-200/60">
                        ★ {Number(st.ratingAverage || 4.9).toFixed(1)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium mt-1">
                        {st.totalServedBookings || 0} lượt cắt
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* ── SECTION: TOP SERVICES & TOP PRODUCTS WITH LINKS ── */}
      <Row gutter={[16, 16]}>
        {/* Top Services */}
        <Col xs={24} lg={12}>
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3">
              <span className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 border border-orange-200/60 flex items-center justify-center text-xs">
                  <FireOutlined />
                </span>
                Dịch vụ được đặt nhiều nhất
              </span>
              <button
                type="button"
                onClick={() => setActiveSection("services")}
                className="text-xs font-bold text-[#0099FF] hover:text-[#0080d9] inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                Quản lý Dịch vụ <RightOutlined className="text-[10px]" />
              </button>
            </div>

            <div className="space-y-2.5">
              {topServices.map((srv, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-slate-50/70 hover:bg-white rounded-xl border border-slate-200/70 hover:border-[#0099FF]/40 hover:shadow-xs flex items-center justify-between cursor-pointer transition-all group"
                  onClick={() => setActiveSection("services")}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-blue-50 text-[#0099FF] border border-blue-200/60 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-xs text-slate-800 group-hover:text-[#0099FF] transition-colors">{srv.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs text-[#0099FF]">{srv.count} lượt</span>
                    <span className="text-[11px] text-slate-400 ml-1.5 font-medium">({formatCurrency(srv.revenue)})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Col>

        {/* Top Products */}
        <Col xs={24} lg={12}>
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3">
              <span className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center text-xs">
                  <ShoppingOutlined />
                </span>
                Sản phẩm Shop bán chạy
              </span>
              <button
                type="button"
                onClick={() => setActiveSection("products")}
                className="text-xs font-bold text-[#0099FF] hover:text-[#0080d9] inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                Quản lý Sản phẩm <RightOutlined className="text-[10px]" />
              </button>
            </div>

            <div className="space-y-2.5">
              {topProducts.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">Chưa có dữ liệu bán hàng Shop</div>
              ) : (
                topProducts.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-50/70 hover:bg-white rounded-xl border border-slate-200/70 hover:border-purple-300 hover:shadow-xs flex items-center justify-between cursor-pointer transition-all group"
                    onClick={() => setActiveSection("products")}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60 font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-xs text-slate-800 group-hover:text-purple-700 transition-colors">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-xs text-purple-700">Đã bán {p.quantity}</span>
                      <span className="text-[11px] text-slate-400 ml-1.5 font-medium">({formatCurrency(p.revenue)})</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}
