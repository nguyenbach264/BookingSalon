import React from "react";
import { Card, Form, Row, Col, Input, Divider, Switch, Button } from "antd";
import { PhoneOutlined } from "@ant-design/icons";

export default function AdminSettingsView() {
  return (
    <div className="max-w-3xl space-y-6">
      <Card title="Cấu hình Quy trình Vận hành Salon" className="rounded-2xl border-gray-100 shadow-sm">
        <Form
          layout="vertical"
          initialValues={{
            autoConfirm: true,
            minAdvance: 30,
            maxCancelHours: 2,
            hotline: "1800 6868",
          }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Thời gian đặt trước tối thiểu (phút)" name="minAdvance">
                <Input type="number" suffix="phút" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Thời gian hủy lịch miễn phí trước giờ hẹn" name="maxCancelHours">
                <Input type="number" suffix="giờ" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Hotline CSKH tổng đài" name="hotline">
            <Input prefix={<PhoneOutlined />} />
          </Form.Item>

          <Divider />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-gray-800 mb-0">Tự động duyệt lịch hẹn hợp lệ</p>
                <span className="text-xs text-gray-400">
                  Tự động chuyển từ Chờ xác nhận sang Đã xác nhận khi còn slot
                </span>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-gray-800 mb-0">Gửi thông báo SMS / Zalo nhắc lịch</p>
                <span className="text-xs text-gray-400">
                  Gửi tin nhắn nhắc khách trước giờ cắt tóc 60 phút
                </span>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <div className="mt-6">
            <Button type="primary" className="bg-[#1b2a4a] hover:bg-[#244383] font-bold rounded-xl h-10 px-6">
              Lưu cấu hình
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
