import React, { useState } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Table,
  Input,
  Tag,
  Popconfirm,
  Modal,
  Form,
  InputNumber,
  Select,
  Switch,
  Rate,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

const { Option } = Select;

export default function AdminProductsView({
  productStats,
  formatCurrency,
  products = [],
  productSearch,
  setProductSearch,
  handleOpenProductModal,
  handleDeleteProduct,
  productModalOpen,
  setProductModalOpen,
  editingProduct,
  productForm,
  handleSaveProduct,
  savingProduct,
  productCategories = [],
}) {
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      {productStats && (
        <Row gutter={[16, 16]}>
          {[
            { label: "Tổng sản phẩm", value: productStats.total, color: "text-blue-700", icon: "📦" },
            { label: "Đang bán", value: productStats.active, color: "text-green-700", icon: "✅" },
            { label: "Hết hàng", value: productStats.outOfStock, color: "text-red-700", icon: "⚠️" },
            { label: "Tổng doanh thu (ước tính)", value: formatCurrency(productStats.totalRevenue), color: "text-purple-700", icon: "💰" },
          ].map(({ label, value, color, icon }) => (
            <Col xs={12} sm={6} key={label}>
              <Card className="rounded-xl border-gray-100 shadow-sm">
                <div className="text-2xl mb-1">{icon}</div>
                <div className={`text-xl font-black ${color}`}>{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Top Sellers */}
      {productStats?.topSellers?.length > 0 && (
        <Card className="rounded-xl border-gray-100 shadow-sm" title={<span className="font-bold">🏆 Top 5 Bán chạy nhất</span>}>
          <div className="space-y-3">
            {productStats.topSellers.map((p, idx) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </span>
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate mb-0">{p.name}</p>
                  <p className="text-xs text-gray-400 mb-0">Đã bán: {p.soldCount} | Doanh thu: {formatCurrency(p.revenue)}đ</p>
                </div>
                <Rate disabled value={p.rating} allowHalf className="text-xs" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Product Table */}
      <Card
        className="rounded-xl border-gray-100 shadow-sm"
        title={<span className="font-bold">📦 Danh sách sản phẩm ({products.length})</span>}
        extra={
          <div className="flex gap-2">
            <Input.Search
              placeholder="Tìm sản phẩm..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              allowClear
              className="w-48"
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenProductModal()}
              className="bg-[#60a5fa]"
            >
              Thêm sản phẩm
            </Button>
          </div>
        }
      >
        <Table
          dataSource={products.filter((p) => !productSearch || p.name?.toLowerCase().includes(productSearch.toLowerCase()))}
          rowKey="id"
          size="middle"
          scroll={{ x: 800 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (t) => `${t} sản phẩm`,
            onChange: (current, pageSize) => setPagination({ current, pageSize }),
          }}
          columns={[
            {
              title: "Sản phẩm",
              key: "product",
              width: 280,
              render: (_, r) => (
                <div className="flex items-center gap-3">
                  <img
                    src={r.imageUrl}
                    alt={r.name}
                    className="w-12 h-12 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                  />
                  <div>
                    <p className="font-semibold text-sm text-gray-800 line-clamp-1 mb-0">{r.name}</p>
                    <p className="text-xs text-gray-400 mb-0">{r.categoryName}</p>
                  </div>
                </div>
              ),
            },
            {
              title: "Giá bán",
              dataIndex: "price",
              key: "price",
              render: (v) => <span className="font-bold text-red-600">{formatCurrency(v)}đ</span>,
            },
            {
              title: "Tồn kho",
              dataIndex: "stockQuantity",
              key: "stock",
              render: (v) => (
                <span className={`font-bold ${v <= 0 ? "text-red-600" : v < 10 ? "text-orange-600" : "text-green-600"}`}>
                  {v}
                </span>
              ),
            },
            {
              title: "Đã bán",
              dataIndex: "soldCount",
              key: "sold",
              render: (v) => <span className="font-semibold text-blue-600">{v || 0}</span>,
            },
            {
              title: "Đánh giá",
              key: "rating",
              render: (_, r) => (
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500 font-bold">{Number(r.rating || 5).toFixed(1)}</span>
                  <span className="text-gray-400 text-xs">★ ({r.reviewCount || 0})</span>
                </div>
              ),
            },
            {
              title: "Trạng thái",
              dataIndex: "active",
              key: "active",
              render: (v) => <Tag color={v ? "success" : "default"}>{v ? "Đang bán" : "Tạm ẩn"}</Tag>,
            },
            {
              title: "Hành động",
              key: "actions",
              fixed: "right",
              width: 120,
              render: (_, r) => (
                <div className="flex gap-1">
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleOpenProductModal(r)}
                    className="text-blue-600 border-blue-200"
                  />
                  <Popconfirm
                    title="Xóa sản phẩm này?"
                    onConfirm={() => handleDeleteProduct(r.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                    okType="danger"
                  >
                    <Button size="small" icon={<DeleteOutlined />} danger />
                  </Popconfirm>
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Product Modal */}
      <Modal
        title={<span className="font-bold">{editingProduct ? "✏️ Chỉnh sửa sản phẩm" : "➕ Thêm sản phẩm mới"}</span>}
        open={productModalOpen}
        onCancel={() => {
          setProductModalOpen(false);
          productForm.resetFields();
        }}
        footer={null}
        width={600}
        style={{ maxWidth: "95vw" }}
      >
        <Form form={productForm} layout="vertical" onFinish={handleSaveProduct} className="mt-4">
          <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm" }]}>
            <Input placeholder="Nhập tên sản phẩm" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả sản phẩm" />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="price" label="Giá bán (VNĐ)" rules={[{ required: true }]}>
                <InputNumber min={0} className="w-full" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="originalPrice" label="Giá gốc (VNĐ)">
                <InputNumber min={0} className="w-full" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="stockQuantity" label="Tồn kho" rules={[{ required: true }]}>
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true }]}>
                <Select placeholder="Chọn danh mục">
                  {productCategories.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="imageUrl" label="URL ảnh sản phẩm">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="active" label="Trạng thái" valuePropName="checked">
            <Switch checkedChildren="Đang bán" unCheckedChildren="Tạm ẩn" />
          </Form.Item>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              onClick={() => {
                setProductModalOpen(false);
                productForm.resetFields();
              }}
            >
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={savingProduct} className="bg-[#60a5fa]">
              Lưu sản phẩm
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
