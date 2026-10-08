import React from "react";
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
} from "antd";
import {
  CalendarOutlined,
  DollarOutlined,
  TeamOutlined,
  ShopOutlined,
  ArrowUpOutlined,
  RiseOutlined,
  BarChartOutlined,
} from "@ant-design/icons";

const { Option } = Select;

// Helper tạo đường cong SVG mượt mà từ mảng tọa độ
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

// Helper tạo vùng gradient kín dưới đường Line SVG
const generateAreaPath = (points, bottomY) => {
  if (!points || points.length === 0) return "";
  const linePath = generateSvgPath(points);
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath} L ${last.x.toFixed(1)} ${bottomY} L ${first.x.toFixed(1)} ${bottomY} Z`;
};

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
  adminTrendPeriod = "week",
  setAdminTrendPeriod,
  adminTrendMetrics = { revenue: 0, bookingRevenue: 0, orderRevenue: 0, totalTransactions: 0, chartData: [] },
  completionRate = 0,
  bookings = [],
  BOOKING_COLUMNS = [],
  setActiveSection,
}) {
  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50/70 to-white">
            <Statistic
              title={<span className="text-xs font-bold uppercase text-blue-700 tracking-wider">Tổng lịch đặt</span>}
              value={totalBookingsCount}
              suffix={<span className="text-xs text-gray-400 font-normal">lịch</span>}
              prefix={<CalendarOutlined className="text-blue-500 mr-1" />}
              valueStyle={{ fontWeight: 900, color: "#1e3a8a" }}
            />
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span>Chờ duyệt: <strong className="text-amber-600">{pendingCount}</strong></span>
              <span>Đã xác nhận: <strong className="text-blue-600">{confirmedCount}</strong></span>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-green-50/70 to-white">
            <Statistic
              title={<span className="text-xs font-bold uppercase text-green-700 tracking-wider">Doanh thu hoàn tất</span>}
              value={totalRevenue}
              formatter={(v) => formatCurrency(v)}
              prefix={<DollarOutlined className="text-green-500 mr-1" />}
              valueStyle={{ fontWeight: 900, color: "#14532d" }}
            />
            <div className="mt-3 flex items-center gap-1 text-xs text-green-600 font-semibold">
              <ArrowUpOutlined />
              <span>Đã phục vụ xong {completedCount} khách</span>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-purple-50/70 to-white">
            <Statistic
              title={<span className="text-xs font-bold uppercase text-purple-700 tracking-wider">Khách hàng thành viên</span>}
              value={users.length}
              suffix={<span className="text-xs text-gray-400 font-normal">người</span>}
              prefix={<TeamOutlined className="text-purple-500 mr-1" />}
              valueStyle={{ fontWeight: 900, color: "#581c87" }}
            />
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span>VIP / Gold: <strong>{users.filter(u => u.membershipTier === 'VIP' || u.membershipTier === 'GOLD').length}</strong></span>
              <span className="text-purple-600">Đang hoạt động</span>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-amber-50/70 to-white">
            <Statistic
              title={<span className="text-xs font-bold uppercase text-amber-700 tracking-wider">Quy mô hệ thống</span>}
              value={salons.length}
              suffix={<span className="text-xs text-gray-400 font-normal">chi nhánh</span>}
              prefix={<ShopOutlined className="text-amber-500 mr-1" />}
              valueStyle={{ fontWeight: 900, color: "#78350f" }}
            />
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span>Stylists: <strong>{stylists.length}</strong> thợ</span>
              <Tag color="success" className="text-[10px]">Tất cả mở cửa</Tag>
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── ANALYTICAL CHARTS SECTION ── */}
      <Row gutter={[16, 16]}>
        {/* Revenue Trend Analytical Chart */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <div className="flex items-center justify-between py-1">
                <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <RiseOutlined className="text-blue-500" />
                  Biểu đồ đánh giá & phân tích Doanh thu toàn hệ thống
                </span>
                <Tag color="blue" className="hidden sm:inline-block">Dịch vụ & Shop Sản phẩm</Tag>
              </div>
            }
            className="rounded-2xl border-gray-100 shadow-sm"
          >
            {/* Dropdown phân loại theo: Ngày, Tuần, Tháng, Năm */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-0">Xu hướng Doanh thu & Lượt giao dịch</h4>
                <p className="text-xs text-gray-400 mb-0">Tổng hợp dữ liệu thực tế từ Lịch đặt Salon và Đơn hàng Shop</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">Phân loại theo kỳ:</span>
                <Select
                  value={adminTrendPeriod}
                  onChange={setAdminTrendPeriod}
                  className="w-48"
                  size="middle"
                >
                  <Option value="day">📅 Hôm nay (Ngày)</Option>
                  <Option value="week">📊 Tuần này (Tuần)</Option>
                  <Option value="month">🗓️ Tháng này (Tháng)</Option>
                  <Option value="year">📈 Năm nay (Năm)</Option>
                </Select>
              </div>
            </div>

            {/* 4 Mini metric cards for selected period */}
            <Row gutter={[12, 12]} className="mb-4">
              {[
                { label: 'Tổng doanh thu kỳ', value: formatCurrency(adminTrendMetrics.revenue), color: 'text-blue-700', bg: 'bg-blue-50', icon: '💰' },
                { label: 'Dịch vụ Salon', value: formatCurrency(adminTrendMetrics.bookingRevenue), color: 'text-sky-700', bg: 'bg-sky-50', icon: '✂️' },
                { label: 'Shop Sản phẩm', value: formatCurrency(adminTrendMetrics.orderRevenue), color: 'text-purple-700', bg: 'bg-purple-50', icon: '🛍️' },
                { label: 'Tổng giao dịch', value: `${adminTrendMetrics.totalTransactions} lượt`, color: 'text-emerald-700', bg: 'bg-emerald-50', icon: '📊' },
              ].map(({label, value, color, bg, icon}) => (
                <Col xs={12} sm={6} key={label}>
                  <div className={`${bg} rounded-xl p-3 text-center border border-gray-100`}>
                    <div className="text-xl mb-1">{icon}</div>
                    <div className={`text-sm sm:text-base font-black ${color}`}>{value}</div>
                    <div className="text-[11px] text-gray-500">{label}</div>
                  </div>
                </Col>
              ))}
            </Row>

            {/* SVG Line Chart for Period */}
            {(() => {
              const chartData = adminTrendMetrics.chartData || [];
              const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1000000);
              const maxCount = Math.max(...chartData.map((d) => d.count), 5);
              const svgWidth = 720;
              const svgHeight = 220;
              const padX = 50;
              const padY = 25;
              const plotW = svgWidth - 2 * padX;
              const plotH = svgHeight - 2 * padY;

              const pointsRev = chartData.map((d, i) => ({
                x: padX + (i / Math.max(chartData.length - 1, 1)) * plotW,
                y: padY + (1 - (d.revenue / maxRevenue)) * (plotH - 25),
                ...d,
              }));

              const pointsCount = chartData.map((d, i) => ({
                x: padX + (i / Math.max(chartData.length - 1, 1)) * plotW,
                y: padY + (1 - (d.count / maxCount)) * (plotH - 25),
                ...d,
              }));

              const linePathRev = generateSvgPath(pointsRev);
              const areaPathRev = generateAreaPath(pointsRev, svgHeight - padY - 10);
              const linePathCount = generateSvgPath(pointsCount);

              return (
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-gray-100">
                  <div className="flex flex-wrap items-center justify-between mb-3 text-xs gap-2">
                    <div className="flex items-center gap-5">
                      <div className="flex items-center gap-2 font-bold text-blue-600">
                        <span className="w-5 h-1 bg-blue-600 rounded-full inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block -ml-3.5 border-2 border-white" />
                        <span>Đường Doanh thu tổng (VNĐ)</span>
                      </div>
                      <div className="flex items-center gap-2 font-bold text-emerald-600">
                        <span className="w-5 h-1 bg-emerald-500 rounded-full inline-block border-t border-dashed" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block -ml-3.5 border-2 border-white" />
                        <span>Đường Lượt giao dịch (Lịch + Đơn)</span>
                      </div>
                    </div>
                    <span className="text-gray-400 font-medium text-[11px]">
                      Đỉnh điểm doanh thu: <strong className="text-blue-600">{formatCurrency(maxRevenue)}</strong>
                    </span>
                  </div>

                  <div className="relative w-full overflow-x-auto">
                    <div className="min-w-[620px]">
                      <svg className="w-full h-64 overflow-visible" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="adminRevAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.01" />
                          </linearGradient>
                        </defs>

                        {/* Horizontal Grid lines */}
                        {[35, 75, 115, 155].map((y, idx) => (
                          <g key={idx}>
                            <line x1="45" y1={y} x2={svgWidth - 40} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                            <text x="35" y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
                              {idx === 0 ? `${(maxRevenue / 1000).toFixed(0)}k` : idx === 3 ? '0' : ''}
                            </text>
                          </g>
                        ))}

                        {/* Revenue Area Gradient Fill */}
                        {areaPathRev && <path d={areaPathRev} fill="url(#adminRevAreaGrad)" />}

                        {/* Revenue Smooth Line Curve */}
                        {linePathRev && (
                          <path
                            d={linePathRev}
                            fill="none"
                            stroke="#2563eb"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}

                        {/* Transactions Count Line Curve */}
                        {linePathCount && (
                          <path
                            d={linePathCount}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2.5"
                            strokeDasharray="5 3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}

                        {/* Interactive Data Nodes with Tooltips */}
                        {pointsRev.map((pt, idx) => {
                          const countPt = pointsCount[idx] || pt;
                          return (
                            <g key={idx}>
                              <line
                                x1={pt.x}
                                y1={30}
                                x2={pt.x}
                                y2={svgHeight - padY - 10}
                                stroke="#cbd5e1"
                                strokeWidth="1"
                                strokeDasharray="2 2"
                                opacity="0.4"
                              />

                              <Tooltip
                                title={
                                  <div className="p-1">
                                    <p className="font-bold mb-1 text-white text-xs border-b border-gray-600 pb-1">{pt.label}</p>
                                    <p className="text-xs text-sky-200 mb-0.5">💰 Tổng doanh thu: <strong>{formatCurrency(pt.revenue)}</strong></p>
                                    <p className="text-[11px] text-gray-300 mb-0.5">✂️ Salon: {formatCurrency(pt.bookingRevenue)} ({pt.bookingCount} lịch)</p>
                                    <p className="text-[11px] text-gray-300 mb-0.5">🛍️ Shop: {formatCurrency(pt.orderRevenue)} ({pt.orderCount} đơn)</p>
                                    <p className="text-xs text-emerald-200 mb-0 font-semibold">📊 Tổng giao dịch: <strong>{pt.count}</strong></p>
                                  </div>
                                }
                              >
                                <circle
                                  cx={pt.x}
                                  cy={pt.y}
                                  r="5"
                                  fill="#2563eb"
                                  stroke="#ffffff"
                                  strokeWidth="2.5"
                                  className="cursor-pointer hover:scale-125 transition-transform"
                                />
                              </Tooltip>

                              <Tooltip title={`${pt.label}: ${pt.count} giao dịch (${pt.bookingCount} lịch hẹn, ${pt.orderCount} đơn hàng)`}>
                                <circle
                                  cx={countPt.x}
                                  cy={countPt.y}
                                  r="4"
                                  fill="#10b981"
                                  stroke="#ffffff"
                                  strokeWidth="2"
                                  className="cursor-pointer hover:scale-125 transition-transform"
                                />
                              </Tooltip>

                              <text
                                x={pt.x}
                                y={svgHeight - 10}
                                textAnchor="middle"
                                fontSize="10"
                                fontWeight="600"
                                fill="#64748b"
                              >
                                {pt.shortLabel || pt.label}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mt-4 px-2">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                        Doanh thu thực tế từ DB
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                        Giao dịch hoàn tất
                      </span>
                    </div>
                    <span>
                      Doanh thu TB: <strong>{formatCurrency(chartData.length > 0 ? Math.round(adminTrendMetrics.revenue / Math.max(chartData.length, 1)) : 0)} / mốc</strong>
                    </span>
                  </div>
                </div>
              );
            })()}
          </Card>
        </Col>

        {/* Status Breakdown & Gauge Chart */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <BarChartOutlined className="text-amber-500" />
                Tỉ lệ thực hiện lịch hẹn
              </span>
            }
            className="rounded-2xl border-gray-100 shadow-sm h-full flex flex-col justify-between"
          >
            <div className="flex flex-col items-center justify-center py-2">
              <Progress
                type="dashboard"
                percent={completionRate}
                strokeColor={{
                  "0%": "#108ee9",
                  "100%": "#87d068",
                }}
                format={(percent) => (
                  <div className="text-center">
                    <span className="text-2xl font-black text-gray-800">{percent}%</span>
                    <div className="text-[11px] text-gray-400">Hoàn thành</div>
                  </div>
                )}
                size={160}
              />

              <div className="w-full mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Đã hoàn thành
                  </span>
                  <strong>{completedCount} lịch ({completionRate}%)</strong>
                </div>
                <Progress percent={completionRate} showInfo={false} strokeColor="#52c41a" size="small" />

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Đã xác nhận / Đang cắt
                  </span>
                  <strong>{confirmedCount} lịch</strong>
                </div>
                <Progress
                  percent={totalBookingsCount > 0 ? Math.round((confirmedCount / totalBookingsCount) * 100) : 0}
                  showInfo={false}
                  strokeColor="#1890ff"
                  size="small"
                />

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Chờ xác nhận
                  </span>
                  <strong>{pendingCount} lịch</strong>
                </div>
                <Progress
                  percent={totalBookingsCount > 0 ? Math.round((pendingCount / totalBookingsCount) * 100) : 0}
                  showInfo={false}
                  strokeColor="#faad14"
                  size="small"
                />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Salon Performance & Recent Activity */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card
            title={
              <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <ShopOutlined className="text-purple-500" />
                Phân bổ theo Chi nhánh Salon
              </span>
            }
            className="rounded-2xl border-gray-100 shadow-sm"
          >
            <div className="space-y-4 py-1">
              {salons.map((salon, i) => {
                const salonBookings = bookings.filter((b) => b.salonId === salon.id);
                const salonRev = salonBookings
                  .filter((b) => b.status === "COMPLETED")
                  .reduce((s, b) => s + (Number(b.totalAmount) || 0), 0);
                const percent = totalRevenue > 0 ? Math.round((salonRev / totalRevenue) * 100) : 33;
                return (
                  <div key={salon.id || i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-gray-800">{salon.salonName}</span>
                      <span className="font-bold text-xs text-amber-700">{formatCurrency(salonRev)}</span>
                    </div>
                    <Progress percent={percent} strokeColor="#722ed1" size="small" />
                    <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
                      <span>{salon.city}</span>
                      <span>{salonBookings.length} lịch đặt</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title={
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <CalendarOutlined className="text-blue-500" />
                  Lịch đặt gần đây nhất
                </span>
                <Button type="link" size="small" onClick={() => setActiveSection("bookings")}>
                  Xem tất cả ({bookings.length})
                </Button>
              </div>
            }
            className="rounded-2xl border-gray-100 shadow-sm"
          >
            <Table
              dataSource={bookings.slice(0, 5)}
              columns={BOOKING_COLUMNS.slice(0, 6)}
              rowKey={(r) => r.id || r.bookingCode}
              pagination={false}
              size="small"
              scroll={{ x: 600 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
