import React, { useState } from "react";
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
  Rate,
  Tabs,
  Empty,
  Input,
  Tooltip,
} from "antd";
import {
  ClockCircleOutlined,
  ScissorOutlined,
  CheckCircleOutlined,
  StarOutlined,
  RiseOutlined,
  BarChartOutlined,
  SmileOutlined,
  FireOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

const { Option } = Select;

const generateSvgPath = (points) => {
  if (!points || points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
};

const generateAreaPath = (points, bottomY) => {
  if (!points || points.length === 0) return "";
  const linePath = generateSvgPath(points);
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath} L ${last.x.toFixed(1)} ${bottomY} L ${first.x.toFixed(1)} ${bottomY} Z`;
};

export default function StylistOverview({
  pendingCount = 0,
  confirmedCount = 0,
  completedCount = 0,
  cancelledCount = 0,
  totalCount = 0,
  profile,
  statsPeriod = "week",
  setStatsPeriod,
  periodMetrics = { revenue: 0, completionRate: 0, avgRevenue: 0, chartData: [], bookings: [] },
  filteredPeriodBookings = [],
  showPeriodTable = true,
  setShowPeriodTable,
  periodSearch = "",
  setPeriodSearch,
  periodStatusFilter = "ALL",
  setPeriodStatusFilter,
  formatCurrency,
  formatDateTime,
  handleStatusChange,
  statusDistribution = [],
  topServicesData = [],
  activeTab = "PENDING",
  setActiveTab,
  STATUS_TABS = [],
  allStylistBookings = [],
  renderBookingCard,
}) {
  const [tablePage, setTablePage] = useState({ current: 1, pageSize: 5 });

  return (
    <div className="space-y-6">
      {/* KPI Stat Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-2xl border-gray-100 shadow-sm bg-gradient-to-br from-yellow-50/70 to-white">
            <Statistic
              title={<span className="text-xs font-bold uppercase text-amber-700 tracking-wider">Chờ xác nhận</span>}
              value={pendingCount}
              suffix={<span className="text-xs text-gray-400 font-normal">lịch</span>}
              prefix={<ClockCircleOutlined className="text-amber-500 mr-1" />}
              valueStyle={{ fontWeight: 900, color: "#78350f" }}
            />
            <div className="mt-2 text-[11px] text-gray-400">Khách vừa đặt cần xác nhận</div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-2xl border-gray-100 shadow-sm bg-gradient-to-br from-blue-50/70 to-white">
            <Statistic
              title={<span className="text-xs font-bold uppercase text-blue-700 tracking-wider">Lịch cắt tóc</span>}
              value={confirmedCount}
              suffix={<span className="text-xs text-gray-400 font-normal">lịch</span>}
              prefix={<ScissorOutlined className="text-blue-500 mr-1" />}
              valueStyle={{ fontWeight: 900, color: "#1e3a8a" }}
            />
            <div className="mt-2 text-[11px] text-blue-600 font-semibold">Đã lên lịch đón tiếp</div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-2xl border-gray-100 shadow-sm bg-gradient-to-br from-green-50/70 to-white">
            <Statistic
              title={<span className="text-xs font-bold uppercase text-green-700 tracking-wider">Đã hoàn thành</span>}
              value={completedCount}
              suffix={<span className="text-xs text-gray-400 font-normal">lượt</span>}
              prefix={<CheckCircleOutlined className="text-green-500 mr-1" />}
              valueStyle={{ fontWeight: 900, color: "#14532d" }}
            />
            <div className="mt-2 text-[11px] text-green-600 font-semibold">Đã hoàn tất thanh toán</div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-2xl border-gray-100 shadow-sm bg-gradient-to-br from-amber-50/70 to-white">
            <Statistic
              title={<span className="text-xs font-bold uppercase text-amber-700 tracking-wider">Đánh giá Stylist</span>}
              value={profile?.totalReviewsCount > 0 ? Number(profile?.ratingAverage).toFixed(1) : "—"}
              suffix={<span className="text-xs text-amber-500 font-normal">{profile?.totalReviewsCount > 0 ? "/ 5.0" : ""}</span>}
              prefix={<StarOutlined className="text-amber-500 mr-1" />}
              valueStyle={{ fontWeight: 900, color: "#b45309" }}
            />
            <div className="mt-2 text-[11px] text-gray-400">
              {profile?.totalReviewsCount > 0 ? `Dựa trên ${profile?.totalReviewsCount} phản hồi thực tế của khách` : "Chưa có đánh giá nào từ khách"}
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── PERIODIC PERFORMANCE & ANALYTICAL CHARTS ── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <div className="flex items-center justify-between py-1">
                <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <RiseOutlined className="text-blue-500" />
                  Hiệu suất phục vụ & Doanh thu theo chu kỳ
                </span>
                <span className="text-xs font-normal text-gray-400">Dữ liệu thực tế từ hệ thống</span>
              </div>
            }
            className="rounded-2xl border-gray-100 shadow-sm"
          >
            {/* Period Filter Dropdown */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-0">Biểu đồ Doanh thu & Lượt khách</h4>
                <p className="text-xs text-gray-400 mb-0">Theo dõi sự tăng trưởng phục vụ theo từng khung thời gian</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">Phân loại theo:</span>
                <Select
                  value={statsPeriod}
                  onChange={setStatsPeriod}
                  className="w-44"
                  size="middle"
                >
                  <Option value="day">📅 Hôm nay (24 giờ)</Option>
                  <Option value="week">📊 Tuần này (Thứ 2 - CN)</Option>
                  <Option value="month">🗓️ Tháng này (Các tuần)</Option>
                  <Option value="year">📈 Năm nay (12 tháng)</Option>
                </Select>
              </div>
            </div>

            {/* 4 Quick Stat Badges for Selected Period */}
            <Row gutter={[12, 12]} className="mb-4">
              <Col xs={12} sm={6}>
                <div className="bg-blue-50/60 rounded-xl p-3 text-center border border-blue-100">
                  <div className="text-xs text-blue-700 font-semibold mb-0.5">Doanh thu kỳ</div>
                  <div className="text-sm sm:text-base font-black text-blue-900 truncate">
                    {formatCurrency(periodMetrics.revenue)}
                  </div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className="bg-emerald-50/60 rounded-xl p-3 text-center border border-emerald-100">
                  <div className="text-xs text-emerald-700 font-semibold mb-0.5">Tỉ lệ hoàn tất</div>
                  <div className="text-sm sm:text-base font-black text-emerald-800">
                    {periodMetrics.completionRate}%
                  </div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className="bg-amber-50/60 rounded-xl p-3 text-center border border-amber-100">
                  <div className="text-xs text-amber-700 font-semibold mb-0.5">Doanh thu TB / lượt</div>
                  <div className="text-sm sm:text-base font-black text-amber-900 truncate">
                    {formatCurrency(periodMetrics.avgRevenue)}
                  </div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className="bg-purple-50/60 rounded-xl p-3 text-center border border-purple-100">
                  <div className="text-xs text-purple-700 font-semibold mb-0.5">Đã phục vụ xong</div>
                  <div className="text-sm sm:text-base font-black text-purple-900">
                    {periodMetrics.completed} khách
                  </div>
                </div>
              </Col>
            </Row>

            {/* Dynamic SVG Curve Chart */}
            {(() => {
              const chartData = periodMetrics.chartData || [];
              const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 500000);
              const maxCount = Math.max(...chartData.map((d) => d.count), 5);
              const svgWidth = 650;
              const svgHeight = 200;
              const padX = 40;
              const padY = 20;
              const plotW = svgWidth - 2 * padX;
              const plotH = svgHeight - 2 * padY;

              const pointsRev = chartData.map((d, i) => ({
                x: padX + (i / Math.max(chartData.length - 1, 1)) * plotW,
                y: padY + (1 - (d.revenue / maxRevenue)) * (plotH - 20),
                ...d,
              }));

              const pointsCount = chartData.map((d, i) => ({
                x: padX + (i / Math.max(chartData.length - 1, 1)) * plotW,
                y: padY + (1 - (d.count / maxCount)) * (plotH - 20),
                ...d,
              }));

              const linePathRev = generateSvgPath(pointsRev);
              const areaPathRev = generateAreaPath(pointsRev, svgHeight - padY - 5);
              const linePathCount = generateSvgPath(pointsCount);

              return (
                <div className="bg-slate-50/60 p-4 rounded-2xl border border-gray-100">
                  <div className="flex items-center justify-between mb-2 text-xs">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-blue-600 font-bold">
                        <span className="w-3 h-1 bg-blue-600 rounded-full inline-block" /> Doanh thu (VNĐ)
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                        <span className="w-3 h-1 bg-emerald-500 rounded-full inline-block" /> Lượt khách đặt
                      </span>
                    </div>
                    <span className="text-gray-400 font-medium">
                      Cao nhất: <strong className="text-blue-600">{formatCurrency(maxRevenue)}</strong>
                    </span>
                  </div>

                  <div className="relative w-full overflow-x-auto">
                    <div className="min-w-[550px]">
                      <svg className="w-full h-52 overflow-visible" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="stylistRevGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {[30, 70, 110, 150].map((y, idx) => (
                          <line key={idx} x1="30" y1={y} x2={svgWidth - 20} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                        ))}

                        {areaPathRev && <path d={areaPathRev} fill="url(#stylistRevGrad)" />}
                        {linePathRev && <path d={linePathRev} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
                        {linePathCount && <path d={linePathCount} fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" strokeLinejoin="round" />}

                        {pointsRev.map((pt, idx) => {
                          const cPt = pointsCount[idx] || pt;
                          return (
                            <g key={idx}>
                              <Tooltip title={`${pt.label}: Doanh thu ${formatCurrency(pt.revenue)} (${pt.count} lượt đặt)`}>
                                <circle cx={pt.x} cy={pt.y} r="4" fill="#2563eb" stroke="#fff" strokeWidth="2" className="cursor-pointer hover:scale-125 transition-transform" />
                              </Tooltip>
                              <circle cx={cPt.x} cy={cPt.y} r="3" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
                              <text x={pt.x} y={svgHeight - 5} textAnchor="middle" fontSize="10" fontWeight="600" fill="#64748b">
                                {pt.label}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Toggle Booking Breakdown Table for Period */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <Button
                type="dashed"
                size="small"
                onClick={() => setShowPeriodTable(!showPeriodTable)}
                className="text-xs font-semibold text-blue-600 rounded-lg"
              >
                {showPeriodTable ? "▲ Thu gọn danh sách chi tiết" : "▼ Xem danh sách chi tiết các lịch hẹn trong kỳ"}
              </Button>
              <span className="text-xs text-gray-400">
                Tổng <strong>{filteredPeriodBookings.length}</strong> lịch hẹn trong kỳ đã lọc
              </span>
            </div>

            {/* Period Bookings Breakdown Table */}
            {showPeriodTable && (
              <div className="mt-3 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                  <Input
                    placeholder="Tìm tên khách, số điện thoại, mã lịch, dịch vụ..."
                    size="small"
                    value={periodSearch}
                    onChange={(e) => setPeriodSearch(e.target.value)}
                    allowClear
                    className="w-full sm:w-64 rounded-lg text-xs"
                  />
                  <Select
                    size="small"
                    value={periodStatusFilter}
                    onChange={setPeriodStatusFilter}
                    className="w-36"
                    options={[
                      { value: "ALL", label: "Tất cả trạng thái" },
                      { value: "PENDING", label: "Chờ xác nhận" },
                      { value: "CONFIRMED", label: "Đã xác nhận" },
                      { value: "COMPLETED", label: "Đã hoàn thành" },
                      { value: "CANCELLED", label: "Đã hủy" },
                    ]}
                  />
                </div>

                <Table
                  dataSource={filteredPeriodBookings}
                  rowKey={(r) => r.id || r.bookingCode}
                  size="small"
                  scroll={{ x: 700 }}
                  pagination={{
                    current: tablePage.current,
                    pageSize: tablePage.pageSize,
                    showSizeChanger: true,
                    pageSizeOptions: ["5", "10", "20", "50"],
                    showTotal: (total) => `Tổng ${total} lịch hẹn`,
                    onChange: (current, pageSize) => setTablePage({ current, pageSize }),
                  }}
                  columns={[
                    {
                      title: "Mã đặt",
                      dataIndex: "bookingCode",
                      key: "bookingCode",
                      render: (v) => <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">#{v}</span>,
                    },
                    {
                      title: "Thời gian",
                      dataIndex: "startTime",
                      key: "startTime",
                      render: (v) => <span className="text-xs text-gray-700">{formatDateTime(v)}</span>,
                    },
                    {
                      title: "Khách hàng",
                      key: "customer",
                      render: (_, r) => (
                        <div>
                          <span className="font-bold text-xs text-gray-800 block">{r.customerName || r.userName || "Khách hàng"}</span>
                          <span className="text-[11px] text-gray-400">{r.customerPhone || r.userPhone || "—"}</span>
                        </div>
                      ),
                    },
                    {
                      title: "Dịch vụ",
                      dataIndex: "serviceName",
                      key: "serviceName",
                      render: (v, r) => (
                        <div>
                          <span className="text-xs text-gray-700 block">{v || "Cắt tóc"}</span>
                          <span className="text-[11px] text-amber-600 font-bold">{formatCurrency(r.totalAmount)}</span>
                        </div>
                      ),
                    },
                    {
                      title: "Trạng thái",
                      dataIndex: "status",
                      key: "status",
                      render: (v) => {
                        const colors = { PENDING: "gold", CONFIRMED: "processing", IN_PROGRESS: "purple", COMPLETED: "success", CANCELLED: "error" };
                        const labels = { PENDING: "Chờ duyệt", CONFIRMED: "Đã nhận", IN_PROGRESS: "Đang cắt", COMPLETED: "Xong", CANCELLED: "Hủy" };
                        return <Tag color={colors[v] || "default"} className="text-xs font-semibold rounded-full">{labels[v] || v}</Tag>;
                      },
                    },
                    {
                      title: "Thao tác",
                      key: "actions",
                      render: (_, r) => (
                        <div className="flex gap-1">
                          {r.status === "PENDING" && (
                            <Button size="small" type="primary" className="bg-blue-600 text-xs px-2" onClick={() => handleStatusChange(r.id, "CONFIRMED")}>
                              Nhận
                            </Button>
                          )}
                          {r.status === "CONFIRMED" && (
                            <Button size="small" type="primary" className="bg-green-600 text-xs px-2" onClick={() => handleStatusChange(r.id, "COMPLETED")}>
                              Xong
                            </Button>
                          )}
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            )}
          </Card>
        </Col>

        {/* Status Distribution & Top Services */}
        <Col xs={24} lg={8}>
          <div className="space-y-4">
            {/* Status Breakdown Gauge */}
            <Card
              title={
                <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <BarChartOutlined className="text-amber-500" />
                  Phân bố trạng thái lịch hẹn
                </span>
              }
              className="rounded-2xl border-gray-100 shadow-sm"
            >
              <div className="space-y-3">
                {statusDistribution.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-600 flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${item.bg}`} />
                        {item.label}
                      </span>
                      <span className="font-bold text-gray-800">
                        {item.count} ({item.percent}%)
                      </span>
                    </div>
                    <Progress percent={item.percent} strokeColor={item.color} size="small" showInfo={false} />
                  </div>
                ))}
              </div>
            </Card>

            {/* Top Performing Services */}
            <Card
              title={
                <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <FireOutlined className="text-amber-500" />
                  Top Dịch vụ bạn được chọn nhiều nhất
                </span>
              }
              className="rounded-2xl border-gray-100 shadow-sm"
            >
              {topServicesData.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu" />
              ) : (
                <div className="space-y-3">
                  {topServicesData.map((srv, idx) => (
                    <div key={srv.id || idx} className="bg-slate-50/70 p-2.5 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-gray-800">{srv.name}</span>
                        <span className="font-black text-xs text-amber-700">{formatCurrency(srv.price)}</span>
                      </div>
                      <Progress percent={srv.percentage} strokeColor="#f59e0b" size="small" showInfo={false} />
                      <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                        <span>Đã thực hiện: {srv.count} lần</span>
                        <span>{srv.percentage}% tổng lượt</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </Col>
      </Row>

      {/* ── APPOINTMENT QUEUE TABS ── */}
      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-gray-800 mb-0">Hàng đợi lịch phục vụ theo trạng thái</h2>
          <span className="text-xs text-gray-400">Tự động đồng bộ thời gian thực</span>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={STATUS_TABS.map((tab) => {
            const list = allStylistBookings.filter((b) => b.status === tab.key);
            return {
              key: tab.key,
              label: (
                <span className="flex items-center gap-1.5 font-bold text-xs">
                  {tab.icon}
                  {tab.label}
                  <Tag color={tab.color} className="ml-1 rounded-full text-[10px] px-1.5 py-0 font-bold leading-none">
                    {list.length}
                  </Tag>
                </span>
              ),
              children: (
                <div className="pt-2">
                  {list.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={<span className="text-gray-400 text-xs">Không có lịch hẹn nào ở trạng thái này</span>}
                      className="py-12"
                    />
                  ) : (
                    <div>
                      {list.map((b) => renderBookingCard(b))}
                    </div>
                  )}
                </div>
              ),
            };
          })}
        />
      </Card>
    </div>
  );
}
