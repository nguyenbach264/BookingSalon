import React, { useState } from "react";
import {
  Row,
  Col,
  Card,
  Input,
  Select,
  Table,
  Rate,
  Tag,
  Popconfirm,
  Button,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";

const { Option } = Select;

export default function AdminReviewsView({
  reviews = [],
  reviewSearch,
  setReviewSearch,
  reviewFilterRating = "ALL",
  setReviewFilterRating,
  products = [],
  handleDeleteReview,
}) {
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  return (
    <div className="space-y-6">
      {/* Reviews Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="rounded-xl border-gray-100 shadow-sm">
            <div className="text-2xl mb-1">⭐</div>
            <div className="text-xl font-black text-amber-500">
              {reviews.length > 0
                ? (reviews.reduce((s, r) => s + (r.rating || 5), 0) / reviews.length).toFixed(1)
                : "5.0"}{" "}
              / 5.0
            </div>
            <div className="text-xs text-gray-500">Điểm đánh giá trung bình</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-xl border-gray-100 shadow-sm">
            <div className="text-2xl mb-1">💬</div>
            <div className="text-xl font-black text-blue-700">{reviews.length}</div>
            <div className="text-xs text-gray-500">Tổng số lượt đánh giá</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-xl border-gray-100 shadow-sm">
            <div className="text-2xl mb-1">🌟</div>
            <div className="text-xl font-black text-emerald-600">
              {reviews.filter((r) => r.rating === 5).length}
            </div>
            <div className="text-xs text-gray-500">Đánh giá 5 sao tuyệt đối</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-xl border-gray-100 shadow-sm">
            <div className="text-2xl mb-1">👍</div>
            <div className="text-xl font-black text-purple-700">
              {reviews.length > 0
                ? Math.round((reviews.filter((r) => (r.rating || 5) >= 4).length / reviews.length) * 100)
                : 100}
              %
            </div>
            <div className="text-xs text-gray-500">Tỉ lệ phản hồi tích cực (4-5★)</div>
          </Card>
        </Col>
      </Row>

      {/* Reviews Table Card */}
      <Card
        className="rounded-xl border-gray-100 shadow-sm"
        title={<span className="font-bold">⭐ Quản lý đánh giá sản phẩm ({reviews.length})</span>}
        extra={
          <div className="flex flex-wrap items-center gap-2">
            <Input.Search
              placeholder="Tìm sản phẩm, khách hàng, nội dung..."
              value={reviewSearch}
              onChange={(e) => setReviewSearch(e.target.value)}
              allowClear
              className="w-56"
              size="small"
            />
            <Select
              value={reviewFilterRating}
              onChange={setReviewFilterRating}
              className="w-36"
              size="small"
            >
              <Option value="ALL">Tất cả số sao</Option>
              <Option value="5">5 sao ⭐⭐⭐⭐⭐</Option>
              <Option value="4">4 sao ⭐⭐⭐⭐</Option>
              <Option value="3">3 sao ⭐⭐⭐</Option>
              <Option value="2">2 sao ⭐⭐</Option>
              <Option value="1">1 sao ⭐</Option>
            </Select>
          </div>
        }
      >
        <Table
          dataSource={reviews.filter((r) => {
            const matchRating =
              reviewFilterRating === "ALL" || String(r.rating) === String(reviewFilterRating);
            const matchSearch =
              !reviewSearch ||
              r.productName?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
              r.username?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
              r.reviewContent?.toLowerCase().includes(reviewSearch.toLowerCase());
            return matchRating && matchSearch;
          })}
          rowKey={(r) => r.id || Math.random()}
          size="middle"
          scroll={{ x: 800 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (t) => `${t} đánh giá`,
            onChange: (current, pageSize) => setPagination({ current, pageSize }),
          }}
          columns={[
            {
              title: "Sản phẩm",
              key: "product",
              width: 250,
              render: (_, r) => {
                const prod = products.find((p) => p.id === r.productId);
                return (
                  <div className="flex items-center gap-2.5">
                    <img
                      src={
                        prod?.imageUrl ||
                        "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=100&auto=format&fit=crop"
                      }
                      alt={r.productName || prod?.name}
                      className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-gray-800 line-clamp-1 mb-0">
                        {r.productName || prod?.name || "Sản phẩm salon"}
                      </p>
                      <span className="text-[10px] text-gray-400 font-mono">
                        ID: {String(r.productId || "").slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                );
              },
            },
            {
              title: "Khách hàng",
              key: "user",
              width: 150,
              render: (_, r) => (
                <div>
                  <p className="font-semibold text-xs text-gray-800 mb-0">{r.username || "Khách hàng"}</p>
                  <Tag color="cyan" className="text-[9px] px-1 py-0 leading-none">
                    Đã mua hàng
                  </Tag>
                </div>
              ),
            },
            {
              title: "Đánh giá",
              dataIndex: "rating",
              key: "rating",
              width: 140,
              render: (v) => <Rate disabled value={v || 5} allowHalf className="text-xs text-amber-500" />,
            },
            {
              title: "Nội dung phản hồi",
              dataIndex: "reviewContent",
              key: "content",
              render: (v) => (
                <p className="text-xs text-gray-700 leading-relaxed mb-0 line-clamp-2">{v || "—"}</p>
              ),
            },
            {
              title: "Thời gian",
              dataIndex: "createdAt",
              key: "date",
              width: 120,
              render: (v) => (
                <span className="text-xs text-gray-400">
                  {v ? new Date(v).toLocaleDateString("vi-VN") : "—"}
                </span>
              ),
            },
            {
              title: "Thao tác",
              key: "actions",
              width: 90,
              render: (_, r) => (
                <Popconfirm
                  title="Xóa đánh giá này khỏi hệ thống?"
                  onConfirm={() => handleDeleteReview(r.id)}
                  okText="Xóa"
                  cancelText="Hủy"
                  okType="danger"
                >
                  <Button size="small" icon={<DeleteOutlined />} danger className="text-xs">
                    Xóa
                  </Button>
                </Popconfirm>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
