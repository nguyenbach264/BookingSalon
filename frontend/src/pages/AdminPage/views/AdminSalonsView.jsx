import React from "react";
import { Row, Col, Card, Tag } from "antd";
import {
  ShopOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

export default function AdminSalonsView({
  salons = [],
  stylists = [],
  bookings = [],
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-0">
            Hệ thống {salons.length} chi nhánh BachBarber
          </h2>
          <p className="text-xs text-gray-400 mb-0">Hà Nội & TP. Hồ Chí Minh</p>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {salons.map((salon) => {
          const salonStylists = stylists.filter((s) => s.salonId === salon.id);
          const salonBookings = bookings.filter((b) => b.salonId === salon.id);
          return (
            <Col key={salon.id} xs={24} md={12} lg={8}>
              <Card className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl flex items-center justify-center text-xl shadow-sm">
                    <ShopOutlined />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-900 mb-0">{salon.salonName}</h3>
                    <span className="text-xs text-gray-400">Khu vực: {salon.city}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-gray-600 mb-4 bg-slate-50/70 p-3.5 rounded-xl border border-gray-100">
                  <p className="mb-0 flex items-start gap-1.5">
                    <EnvironmentOutlined className="text-amber-500 mt-0.5" />
                    <span>{salon.address}</span>
                  </p>
                  <p className="mb-0 flex items-center gap-1.5">
                    <PhoneOutlined className="text-amber-500" />
                    <span>{salon.phoneNumber || "1800 6868"}</span>
                  </p>
                  <p className="mb-0 flex items-center gap-1.5">
                    <ClockCircleOutlined className="text-amber-500" />
                    <span>
                      {Array.isArray(salon.openTime)
                        ? `${String(salon.openTime[0]).padStart(2, "0")}:${String(salon.openTime[1]).padStart(2, "0")}`
                        : salon.openTime} –{" "}
                      {Array.isArray(salon.closeTime)
                        ? `${String(salon.closeTime[0]).padStart(2, "0")}:${String(salon.closeTime[1]).padStart(2, "0")}`
                        : salon.closeTime}
                    </span>
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                  <span>Thợ phụ trách: <strong>{salonStylists.length} Stylists</strong></span>
                  <span>Lịch hẹn: <strong>{salonBookings.length}</strong></span>
                  <Tag color={salon.enabled ? "success" : "error"} className="text-xs m-0">
                    {salon.enabled ? "Đang mở cửa" : "Tạm đóng"}
                  </Tag>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
