import React from "react";
import { Row, Col, Card, Tag } from "antd";
import { ScissorOutlined } from "@ant-design/icons";

export default function StylistServices({ services = [], formatCurrency }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-0">Dịch vụ bạn phụ trách</h2>
          <p className="text-xs text-gray-400 mb-0">
            Khách hàng có thể chọn bạn cho các dịch vụ chuyên môn này
          </p>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {services.map((srv) => (
          <Col key={srv.id} xs={24} sm={12} lg={8}>
            <Card className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg shadow-sm">
                  <ScissorOutlined />
                </div>
                <span className="font-bold text-base text-amber-700">
                  {formatCurrency(srv.price)}
                </span>
              </div>

              <h3 className="font-bold text-sm text-gray-800 mb-1">{srv.serviceName}</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <span>
                  ⏱️ Thời gian thực hiện: <strong>{srv.duration || 45} phút</strong>
                </span>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-400">Chứng nhận tay nghề:</span>
                <Tag color="success" className="text-[10px]">
                  ĐÃ ĐẠT CHUẨN
                </Tag>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
