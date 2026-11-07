import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Tag,
  Button,
  Table,
  Spin,
  Badge,
  Avatar,
  Segmented,
  Tooltip,
} from "antd";
import {
  ShopOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  DollarOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  StarOutlined,
  FireOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { getSalonById, getSalons } from "../../../service/api/salonApi";
import { getAllBookings } from "../../../service/api/bookingApi";
import { getStylists } from "../../../service/api/adminApi";

const formatCurrency = (val) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val ?? 0);

export default function SalonDetailPage() {
  const { salonId } = useParams();
  const navigate = useNavigate();

  const [salon, setSalon] = useState(null);
  const [allSalons, setAllSalons] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("ALL");

  useEffect(() => {
    loadSalonDetails();
  }, [salonId]);

  const loadSalonDetails = async () => {
    setLoading(true);
    try {
      const [salonData, salonsData, bookingsData, stylistsData] = await Promise.allSettled([
        getSalonById(salonId),
        getSalons(),
        getAllBookings(),
        getStylists(),
      ]);

      if (salonData.status === "fulfilled") setSalon(salonData.value);
      if (salonsData.status === "fulfilled") setAllSalons(salonsData.value || []);
      if (bookingsData.status === "fulfilled") setBookings(bookingsData.value || []);
      if (stylistsData.status === "fulfilled") setStylists(stylistsData.value || []);
    } catch (err) {
      console.error("Error loading salon details:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings for this salon
  const salonBookings = bookings.filter((b) => b.salonId === salonId);
  const salonStylists = stylists.filter(
    (s) => s.salonId === salonId || (salon && s.salonName === salon.salonName)
  );

  const completedBookings = salonBookings.filter((b) => b.status === "COMPLETED");
  const pendingBookings = salonBookings.filter((b) => b.status === "PENDING");
  const inProgressBookings = salonBookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "IN_PROGRESS"
  );
  const cancelledBookings = salonBookings.filter((b) => b.status === "CANCELLED");

  const totalRevenue = completedBookings.reduce(
    (sum, b) => sum + (Number(b.totalAmount) || 0),
    0
  );
  const completionRate =
    salonBookings.length > 0
      ? Math.round((completedBookings.length / salonBookings.length) * 100)
      : 0;

  // Service breakdown in this salon
  const serviceStats = {};
  salonBookings.forEach((b) => {
    const sName = b.serviceName || b.serviceOfferingName || "Dịch vụ chuẩn";
    if (!serviceStats[sName]) {
      serviceStats[sName] = { name: sName, count: 0, revenue: 0 };
    }
    serviceStats[sName].count += 1;
    if (b.status === "COMPLETED") {
      serviceStats[sName].revenue += Number(b.totalAmount) || 0;
    }
  });
  const topServices = Object.values(serviceStats).sort((a, b) => b.count - a.count);
  const maxServiceCount = topServices[0]?.count || 1;

  // Peak hours breakdown
  const hourMap = {
    "08:00 - 10:00": 0,
    "10:00 - 12:00": 0,
    "12:00 - 14:00": 0,
    "14:00 - 16:00": 0,
    "16:00 - 18:00": 0,
    "18:00 - 20:00": 0,
    "20:00 - 22:00": 0,
  };
  salonBookings.forEach((b) => {
    const dt = b.startTime || b.bookingDate;
    if (!dt) return;
    const hour = new Date(dt).getHours();
    if (hour >= 8 && hour < 10) hourMap["08:00 - 10:00"] += 1;
    else if (hour >= 10 && hour < 12) hourMap["10:00 - 12:00"] += 1;
    else if (hour >= 12 && hour < 14) hourMap["12:00 - 14:00"] += 1;
    else if (hour >= 14 && hour < 16) hourMap["14:00 - 16:00"] += 1;
    else if (hour >= 16 && hour < 18) hourMap["16:00 - 18:00"] += 1;
    else if (hour >= 18 && hour < 20) hourMap["18:00 - 20:00"] += 1;
    else if (hour >= 20 && hour < 22) hourMap["20:00 - 22:00"] += 1;
  });
  const maxSlot = Math.max(...Object.values(hourMap), 1);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spin size="large" tip="Đang tải dữ liệu chi tiết chi nhánh..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60 p-4 sm:p-6 md:p-8 space-y-6">
      {/* ── TOP NAV BAR ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/admin/dashboard")}
            className="rounded-xl"
          >
            Quay lại Admin
          </Button>
          <div>
            <h1 className="text-lg font-black text-gray-900 mb-0 flex items-center gap-2">
              <ShopOutlined className="text-amber-500" />
              {salon?.salonName || "Chi tiết chi nhánh"}
            </h1>
            <p className="text-xs text-gray-400 mb-0 mt-0.5">
              Mã chi nhánh: <span className="font-mono text-gray-600">{salonId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Tag color={salon?.enabled ? "success" : "error"} className="text-xs px-3 py-1 font-bold">
            {salon?.enabled ? "● Đang hoạt động mở cửa" : "○ Đang tạm ngưng nhận khách"}
          </Tag>
        </div>
      </div>

      {/* ── SALON INFO BANNER ── */}
      <Card className="rounded-2xl border-gray-100 shadow-sm bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={16}>
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                <EnvironmentOutlined /> {salon?.city || "Hà Nội"}
              </div>
              <h2 className="text-2xl font-black text-white mb-1">{salon?.salonName}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-300 pt-1">
                <div className="flex items-center gap-2">
                  <EnvironmentOutlined className="text-amber-400" />
                  <span>{salon?.address || "Đang cập nhật địa chỉ"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PhoneOutlined className="text-amber-400" />
                  <span>Hotline: {salon?.phoneNumber || "1900 1234"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockCircleOutlined className="text-amber-400" />
                  <span>
                    Giờ hoạt động:{" "}
                    {Array.isArray(salon?.openTime)
                      ? `${String(salon.openTime[0]).padStart(2, "0")}:${String(salon.openTime[1]).padStart(2, "0")}`
                      : salon?.openTime || "08:30"}{" "}
                    –{" "}
                    {Array.isArray(salon?.closeTime)
                      ? `${String(salon.closeTime[0]).padStart(2, "0")}:${String(salon.closeTime[1]).padStart(2, "0")}`
                      : salon?.closeTime || "21:30"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TeamOutlined className="text-amber-400" />
                  <span>Quy mô: <strong>{salonStylists.length} thợ chính</strong></span>
                </div>
              </div>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center">
              <div className="text-xs uppercase text-amber-300 font-bold tracking-wider mb-1">
                Doanh thu tích lũy tại quán
              </div>
              <div className="text-2xl font-black text-amber-400 mb-2">
                {formatCurrency(totalRevenue)}
              </div>
              <div className="text-[11px] text-gray-300">
                Đã phục vụ hoàn thành {completedBookings.length} lượt khách
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* ── KPI CARDS ── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-2xl border-gray-100 shadow-sm">
            <Statistic
              title={<span className="text-xs font-bold uppercase text-gray-500">Tổng lịch hẹn</span>}
              value={salonBookings.length}
              suffix={<span className="text-xs text-gray-400 font-normal">lượt</span>}
              prefix={<CalendarOutlined className="text-blue-500 mr-1" />}
              valueStyle={{ fontWeight: 900, color: "#1e3a8a" }}
            />
            <div className="mt-3 flex justify-between text-xs text-gray-500">
              <span>Chờ duyệt: <strong className="text-amber-600">{pendingBookings.length}</strong></span>
              <span>Đang làm: <strong className="text-blue-600">{inProgressBookings.length}</strong></span>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-2xl border-gray-100 shadow-sm">
            <Statistic
              title={<span className="text-xs font-bold uppercase text-gray-500">Tỉ lệ hoàn thành</span>}
              value={completionRate}
              suffix="%"
              prefix={<CheckCircleOutlined className="text-emerald-500 mr-1" />}
              valueStyle={{ fontWeight: 900, color: "#065f46" }}
            />
            <Progress percent={completionRate} strokeColor="#10b981" size="small" className="mt-2" />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-2xl border-gray-100 shadow-sm">
            <Statistic
              title={<span className="text-xs font-bold uppercase text-gray-500">Đội ngũ Stylist</span>}
              value={salonStylists.length}
              suffix={<span className="text-xs text-gray-400 font-normal">thợ</span>}
              prefix={<TeamOutlined className="text-purple-500 mr-1" />}
              valueStyle={{ fontWeight: 900, color: "#581c87" }}
            />
            <div className="mt-3 text-xs text-purple-600 font-semibold">
              ⭐ Đánh giá trung bình: 4.9 / 5.0
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-2xl border-gray-100 shadow-sm">
            <Statistic
              title={<span className="text-xs font-bold uppercase text-gray-500">Khách hủy hẹn</span>}
              value={cancelledBookings.length}
              suffix={<span className="text-xs text-gray-400 font-normal">lịch</span>}
              prefix={<ThunderboltOutlined className="text-rose-500 mr-1" />}
              valueStyle={{ fontWeight: 900, color: "#9f1239" }}
            />
            <div className="mt-3 text-xs text-gray-400">
              Tỉ lệ hủy: {salonBookings.length > 0 ? Math.round((cancelledBookings.length / salonBookings.length) * 100) : 0}%
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── STYLISTS & SERVICES SECTION ── */}
      <Row gutter={[16, 16]}>
        {/* Stylists in this salon */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <div className="flex items-center justify-between py-1">
                <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <TeamOutlined className="text-purple-600" />
                  Danh sách Stylist làm việc tại chi nhánh
                </span>
                <Tag color="purple">{salonStylists.length} nhân sự</Tag>
              </div>
            }
            className="rounded-2xl border-gray-100 shadow-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-600 font-semibold text-[11px]">
                    <th className="py-2.5 px-3">Stylist</th>
                    <th className="py-2.5 px-3 text-center">Khách phục vụ</th>
                    <th className="py-2.5 px-3 text-right">Doanh thu</th>
                    <th className="py-2.5 px-3 text-center">Đánh giá ★</th>
                    <th className="py-2.5 px-3 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {salonStylists.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-400">
                        Chưa có thợ nào được phân công tại chi nhánh này
                      </td>
                    </tr>
                  ) : (
                    salonStylists.map((st, idx) => {
                      const stBookings = salonBookings.filter((b) => b.stylistId === st.id);
                      const stCompleted = stBookings.filter((b) => b.status === "COMPLETED");
                      const stRev = stCompleted.reduce((s, b) => s + (Number(b.totalAmount) || 0), 0);
                      return (
                        <tr key={st.id || idx} className="hover:bg-slate-50">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar src={st.avatarUrl} size={32} icon={<UserOutlined />} />
                              <div>
                                <div className="font-bold text-gray-900">{st.fullName}</div>
                                <div className="text-[10px] text-gray-400">@{st.username || "stylist"}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-gray-800">
                            {stCompleted.length || st.totalServedBookings || 0}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-emerald-700">
                            {formatCurrency(stRev)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Tag color="gold" className="m-0 font-bold">
                              ★ {Number(st.ratingAverage || 4.9).toFixed(1)}
                            </Tag>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Tag color="success" className="m-0 text-[10px]">
                              Sẵn sàng
                            </Tag>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </Col>

        {/* Most booked services in this salon */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <div className="flex items-center justify-between py-1">
                <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <FireOutlined className="text-amber-500" />
                  Top Dịch vụ tại chi nhánh
                </span>
                <Tag color="orange">Ưa chuộng nhất</Tag>
              </div>
            }
            className="rounded-2xl border-gray-100 shadow-sm"
          >
            <div className="space-y-3.5 py-1">
              {topServices.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs">Chưa có dữ liệu đặt lịch</div>
              ) : (
                topServices.slice(0, 5).map((srv, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-bold text-gray-800">
                        {idx + 1}. {srv.name}
                      </span>
                      <span className="text-blue-700 font-bold">{srv.count} lượt</span>
                    </div>
                    <Progress
                      percent={Math.round((srv.count / maxServiceCount) * 100)}
                      strokeColor="#f59e0b"
                      size="small"
                    />
                    <div className="text-[10px] text-gray-400 mt-1 text-right">
                      Doanh thu: {formatCurrency(srv.revenue)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── PEAK HOURS & RECENT BOOKINGS TABLE ── */}
      <Row gutter={[16, 16]}>
        {/* Peak Hours */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <ClockCircleOutlined className="text-blue-500" />
                Khung giờ khách đến tại cơ sở
              </span>
            }
            className="rounded-2xl border-gray-100 shadow-sm"
          >
            <div className="space-y-3 py-1">
              {Object.entries(hourMap).map(([time, count], idx) => {
                const pct = Math.round((count / maxSlot) * 100);
                const isPeak = pct >= 80;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-28 text-xs font-semibold text-gray-700">{time}</span>
                    <div className="flex-1">
                      <Progress
                        percent={pct}
                        strokeColor={isPeak ? "#ef4444" : pct >= 50 ? "#3b82f6" : "#10b981"}
                        size="small"
                        format={() => (
                          <span className={`text-[11px] font-bold ${isPeak ? "text-red-500" : "text-gray-600"}`}>
                            {count} khách {isPeak ? "🔥" : ""}
                          </span>
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>

        {/* Recent Bookings in this salon */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <div className="flex items-center justify-between py-1">
                <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <CalendarOutlined className="text-blue-500" />
                  Danh sách lịch hẹn tại chi nhánh
                </span>
                <span className="text-xs text-gray-400">Tổng {salonBookings.length} lịch</span>
              </div>
            }
            className="rounded-2xl border-gray-100 shadow-sm"
          >
            <Table
              dataSource={salonBookings.slice(0, 8)}
              rowKey={(r) => r.id || r.bookingCode}
              pagination={false}
              size="small"
              scroll={{ x: 600 }}
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
          </Card>
        </Col>
      </Row>
    </div>
  );
}
