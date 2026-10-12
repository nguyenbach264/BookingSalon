import React, { useState } from "react";
import { Row, Col, Card, Tag, Statistic, Modal, Table } from "antd";
import { ScissorOutlined, CheckCircleOutlined, DollarOutlined, EyeOutlined } from "@ant-design/icons";

export default function StylistServices({ services = [], formatCurrency }) {
  const [kpiModalTitle, setKpiModalTitle] = useState("");
  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const [kpiModalList, setKpiModalList] = useState([]);

  const handleOpenKpi = (title, list) => {
    setKpiModalTitle(title);
    setKpiModalList(list);
    setKpiModalOpen(true);
  };

  const avgPrice = services.length > 0
    ? services.reduce((sum, s) => sum + (Number(s.price) || 0), 0) / services.length
    : 0;

  return (
    <div className="space-y-6">
      {/* ── TOP KPI STATS CARDS WITH DRILL-DOWN ── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-blue-50/60 group"
            onClick={() => handleOpenKpi("Tất cả dịch vụ bạn phụ trách", services)}
          >
            <Statistic
              title={<span className="text-xs font-bold uppercase text-blue-700">Tổng dịch vụ phụ trách</span>}
              value={services.length}
              suffix={<span className="text-xs text-gray-400 font-normal">dịch vụ</span>}
              prefix={<ScissorOutlined className="text-blue-500 mr-1" />}
              styles={{ content: { fontWeight: 900, color: "#1e3a8a" } }}
            />
            <div className="mt-2 text-xs text-blue-600 font-medium flex items-center justify-between group-hover:underline">
              <span>Được phân công chuyên môn</span>
              <EyeOutlined />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-emerald-50/60 group"
            onClick={() => handleOpenKpi("Dịch vụ đã đạt chuẩn tay nghề", services)}
          >
            <Statistic
              title={<span className="text-xs font-bold uppercase text-emerald-700">Đã đạt chuẩn phục vụ</span>}
              value={services.length}
              suffix={<span className="text-xs text-gray-400 font-normal">dịch vụ</span>}
              prefix={<CheckCircleOutlined className="text-emerald-500 mr-1" />}
              styles={{ content: { fontWeight: 900, color: "#065f46" } }}
            />
            <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center justify-between group-hover:underline">
              <span>Sẵn sàng đón tiếp khách</span>
              <EyeOutlined />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-amber-50/60 group"
            onClick={() => handleOpenKpi("Bảng giá dịch vụ bạn phụ trách", services)}
          >
            <Statistic
              title={<span className="text-xs font-bold uppercase text-amber-700">Giá trung bình dịch vụ</span>}
              value={avgPrice}
              formatter={(v) => formatCurrency(v)}
              prefix={<DollarOutlined className="text-amber-500 mr-1" />}
              styles={{ content: { fontWeight: 900, color: "#78350f" } }}
            />
            <div className="mt-2 text-xs text-amber-700 font-medium flex items-center justify-between group-hover:underline">
              <span>Mức phí trung bình / lượt</span>
              <EyeOutlined />
            </div>
          </Card>
        </Col>
      </Row>

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

      {/* ── MODAL: KPI SERVICES DRILL-DOWN ────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-2 font-bold text-gray-800">
            <ScissorOutlined className="text-blue-600" />
            <span>{kpiModalTitle} ({kpiModalList.length})</span>
          </div>
        }
        open={kpiModalOpen}
        onCancel={() => setKpiModalOpen(false)}
        footer={null}
        width={750}
        centered
        destroyOnHidden
      >
        <div className="mt-4">
          <Table
            dataSource={kpiModalList}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 6 }}
            columns={[
              {
                title: "Dịch vụ",
                dataIndex: "serviceName",
                render: (v) => <span className="font-bold text-xs text-gray-900">{v}</span>,
              },
              {
                title: "Giá dịch vụ",
                dataIndex: "price",
                render: (v) => <span className="font-bold text-xs text-amber-700">{formatCurrency(v)}</span>,
              },
              {
                title: "Thời gian",
                dataIndex: "duration",
                render: (v) => <span className="text-xs">{v || 45} phút</span>,
              },
              {
                title: "Chứng nhận",
                key: "certified",
                render: () => <Tag color="success">ĐÃ ĐẠT CHUẨN</Tag>,
              },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}
