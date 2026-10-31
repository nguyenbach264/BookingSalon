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
  Modal,
  Statistic,
} from "antd";
import {
  DeleteOutlined,
  EyeOutlined,
  StarOutlined,
  MessageOutlined,
  LikeOutlined,
} from "@ant-design/icons";

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

  // Detail Modal for Reviews KPI Cards
  const [kpiReviewModalTitle, setKpiReviewModalTitle] = useState("");
  const [kpiReviewModalOpen, setKpiReviewModalOpen] = useState(false);
  const [kpiReviewModalList, setKpiReviewModalList] = useState([]);

  const handleOpenReviewKpi = (title, list) => {
    setKpiReviewModalTitle(title);
    setKpiReviewModalList(list);
    setKpiReviewModalOpen(true);
  };

  const avgRating = (reviews || []).length > 0
    ? ((reviews || []).reduce((s, r) => s + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : "5.0";
  const fiveStarReviews = (reviews || []).filter((r) => r.rating === 5);
  const positiveReviews = (reviews || []).filter((r) => (r.rating || 5) >= 4);
  const positiveRate = (reviews || []).length > 0
    ? Math.round((positiveReviews.length / reviews.length) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* ── TOP KPI STATS CARDS WITH DRILL-DOWN ── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-amber-50/60 group"
            onClick={() => handleOpenReviewKpi("Tất cả đánh giá xếp theo điểm", [...(reviews || [])].sort((a, b) => (b.rating || 5) - (a.rating || 5)))}
          >
            <Statistic
              title={<span className="text-xs font-bold uppercase text-amber-700">Điểm đánh giá TB</span>}
              value={avgRating}
              suffix={<span className="text-xs text-amber-500 font-normal">/ 5.0</span>}
              prefix={<StarOutlined className="text-amber-500 mr-1" />}
              styles={{ content: { fontWeight: 900, color: "#78350f" } }}
            />
            <div className="mt-2 text-xs text-amber-700 font-medium flex items-center justify-between group-hover:underline">
              <span>Chất lượng chung: Rất tốt</span>
              <EyeOutlined />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-blue-50/60 group"
            onClick={() => handleOpenReviewKpi("Tất cả lượt đánh giá sản phẩm", reviews || [])}
          >
            <Statistic
              title={<span className="text-xs font-bold uppercase text-blue-700">Tổng lượt đánh giá</span>}
              value={(reviews || []).length}
              suffix={<span className="text-xs text-gray-400 font-normal">lượt</span>}
              prefix={<MessageOutlined className="text-blue-500 mr-1" />}
              styles={{ content: { fontWeight: 900, color: "#1e3a8a" } }}
            />
            <div className="mt-2 text-xs text-blue-600 font-medium flex items-center justify-between group-hover:underline">
              <span>Phản hồi từ người mua hàng</span>
              <EyeOutlined />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-emerald-50/60 group"
            onClick={() => handleOpenReviewKpi("Danh sách đánh giá 5 sao tuyệt đối", fiveStarReviews)}
          >
            <Statistic
              title={<span className="text-xs font-bold uppercase text-emerald-700">Đánh giá 5 sao</span>}
              value={fiveStarReviews.length}
              suffix={<span className="text-xs text-gray-400 font-normal">lượt</span>}
              prefix={<StarOutlined className="text-emerald-500 mr-1" />}
              styles={{ content: { fontWeight: 900, color: "#065f46" } }}
            />
            <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center justify-between group-hover:underline">
              <span>Khách hàng cực kỳ hài lòng</span>
              <EyeOutlined />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-purple-50/60 group"
            onClick={() => handleOpenReviewKpi("Danh sách phản hồi tích cực (4-5 sao)", positiveReviews)}
          >
            <Statistic
              title={<span className="text-xs font-bold uppercase text-purple-700">Tỉ lệ hài lòng</span>}
              value={positiveRate}
              suffix={<span className="text-xs text-purple-400 font-normal">%</span>}
              prefix={<LikeOutlined className="text-purple-500 mr-1" />}
              styles={{ content: { fontWeight: 900, color: "#581c87" } }}
            />
            <div className="mt-2 text-xs text-purple-600 font-medium flex items-center justify-between group-hover:underline">
              <span>Đánh giá từ 4★ đến 5★</span>
              <EyeOutlined />
            </div>
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

      {/* ── MODAL: KPI REVIEWS DRILL-DOWN ────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-2 font-bold text-gray-800">
            <StarOutlined className="text-amber-500" />
            <span>{kpiReviewModalTitle} ({kpiReviewModalList.length})</span>
          </div>
        }
        open={kpiReviewModalOpen}
        onCancel={() => setKpiReviewModalOpen(false)}
        footer={null}
        width={800}
        centered
        destroyOnHidden
      >
        <div className="mt-4">
          <Table
            dataSource={kpiReviewModalList}
            rowKey={(r) => r.id || `${r.productId}-${r.createdAt}`}
            size="small"
            pagination={{ pageSize: 6 }}
            columns={[
              {
                title: "Sản phẩm",
                dataIndex: "productName",
                render: (v) => <span className="font-bold text-xs text-gray-900">{v || "Sản phẩm Shop"}</span>,
              },
              {
                title: "Khách hàng",
                dataIndex: "userName",
                render: (v) => <span className="text-xs text-gray-600">{v || "Khách ẩn danh"}</span>,
              },
              {
                title: "Số sao",
                dataIndex: "rating",
                render: (v) => <Rate disabled value={v || 5} allowHalf className="text-xs text-amber-500" />,
              },
              {
                title: "Nội dung",
                dataIndex: "reviewContent",
                render: (v) => <span className="text-xs text-gray-700 line-clamp-2">{v || "—"}</span>,
              },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}
