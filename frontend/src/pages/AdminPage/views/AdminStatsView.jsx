import React from "react";
import { Row, Col, Card, Segmented, Progress, Avatar } from "antd";
import { FireOutlined, StarOutlined } from "@ant-design/icons";

export default function AdminStatsView({
  statsRange = "7_DAYS",
  setStatsRange,
  topServicesData = [],
  stylists = [],
  formatCurrency,
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-0">Báo cáo phân tích chuyên sâu</h2>
          <p className="text-xs text-gray-400 mb-0">Dữ liệu tài chính, chất lượng dịch vụ & KPIs</p>
        </div>
        <Segmented
          options={[
            { label: "7 ngày qua", value: "7_DAYS" },
            { label: "30 ngày qua", value: "30_DAYS" },
            { label: "Quý này", value: "QUARTER" },
            { label: "Năm 2026", value: "YEAR" },
          ]}
          value={statsRange}
          onChange={setStatsRange}
        />
      </div>

      {/* Operational Quality Gauges */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="rounded-2xl border-gray-100 shadow-sm text-center p-4">
            <Progress type="circle" percent={96} strokeColor="#52c41a" size={110} />
            <h4 className="font-bold text-sm text-gray-800 mt-3 mb-1">Tỉ lệ đúng giờ</h4>
            <p className="text-xs text-gray-400 mb-0">Khách hàng được phục vụ đúng khung giờ hẹn</p>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card className="rounded-2xl border-gray-100 shadow-sm text-center p-4">
            <Progress type="circle" percent={88} strokeColor="#1890ff" size={110} />
            <h4 className="font-bold text-sm text-gray-800 mt-3 mb-1">Tỉ lệ khách hàng quay lại</h4>
            <p className="text-xs text-gray-400 mb-0">Hội viên đặt lịch lại trong vòng 30 ngày</p>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card className="rounded-2xl border-gray-100 shadow-sm text-center p-4">
            <Progress type="circle" percent={98} strokeColor="#faad14" size={110} />
            <h4 className="font-bold text-sm text-gray-800 mt-3 mb-1">Mức độ hài lòng (CSAT)</h4>
            <p className="text-xs text-gray-400 mb-0">Đánh giá 4 sao trở lên từ khách hàng</p>
          </Card>
        </Col>
      </Row>

      {/* Top Services Chart & Top Stylists Ranking */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span className="font-bold text-sm text-gray-800 flex items-center gap-2">
                <FireOutlined className="text-amber-500" />
                Top Dịch vụ được lựa chọn nhiều nhất
              </span>
            }
            className="rounded-2xl border-gray-100 shadow-sm"
          >
            <div className="space-y-4 py-2">
              {topServicesData.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Chưa có dữ liệu đặt lịch</p>
              ) : (
                topServicesData.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-gray-800">{idx + 1}. {item.name}</span>
                      <span className="text-gray-500">{item.count} lượt ({formatCurrency(item.rev)})</span>
                    </div>
                    <Progress percent={item.percent} strokeColor={item.color} size="small" />
                  </div>
                ))
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <span className="font-bold text-sm text-gray-800 flex items-center gap-2">
                <StarOutlined className="text-amber-500" />
                Bảng xếp hạng Hiệu suất Stylist
              </span>
            }
            className="rounded-2xl border-gray-100 shadow-sm"
          >
            <div className="space-y-3 py-1">
              {stylists.slice(0, 5).map((st, idx) => (
                <div key={st.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                      idx === 0 ? "bg-amber-400 text-black shadow-sm" : idx === 1 ? "bg-slate-300 text-gray-800" : "bg-gray-200 text-gray-600"
                    }`}>
                      {idx + 1}
                    </span>
                    <Avatar size={36} src={st.avatarUrl} />
                    <div>
                      <p className="font-bold text-xs text-gray-800 mb-0">{st.fullName}</p>
                      <span className="text-[11px] text-gray-400">{st.salonName}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-xs text-amber-600 mb-0">
                      {st.totalReviewsCount > 0 ? `${Number(st.ratingAverage).toFixed(1)} ★` : "Chưa có ★"}
                    </p>
                    <span className="text-[11px] text-gray-500">
                      {st.totalReviewsCount > 0 ? `${st.totalReviewsCount} đánh giá` : `${st.totalServedBookings || 0} lượt cắt`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
