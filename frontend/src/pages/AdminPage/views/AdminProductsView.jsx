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
  Statistic,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  DollarOutlined,
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

  // Detail Modal for Products KPI Cards
  const [kpiProductModalTitle, setKpiProductModalTitle] = useState("");
  const [kpiProductModalOpen, setKpiProductModalOpen] = useState(false);
  const [kpiProductModalList, setKpiProductModalList] = useState([]);

  const handleOpenProductKpi = (title, list) => {
    setKpiProductModalTitle(title);
    setKpiProductModalList(list);
    setKpiProductModalOpen(true);
  };

  const totalProducts = (products || []).length;
  const activeProducts = (products || []).filter((p) => p.active !== false);
  const outOfStockProducts = (products || []).filter((p) => (p.stockQuantity || 0) <= 0);
  const topSellersProducts = productStats?.topSellers || (products || []).filter((p) => (p.soldCount || 0) > 0);
  const totalRev = productStats?.totalRevenue || (products || []).reduce((sum, p) => sum + ((p.soldCount || 0) * (p.price || 0)), 0);

  return (
    <div className="space-y-6">
      {/* ── TOP KPI STATS CARDS WITH DRILL-DOWN ── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-blue-50/60 group"
            onClick={() => handleOpenProductKpi("Tất cả sản phẩm trong hệ thống", products || [])}
          >
            <Statistic
              title={<span className="text-xs font-bold uppercase text-blue-700">Tổng sản phẩm</span>}
              value={totalProducts}
              suffix={<span className="text-xs text-gray-400 font-normal">mặt hàng</span>}
              prefix={<ShoppingOutlined className="text-blue-500 mr-1" />}
              styles={{ content: { fontWeight: 900, color: "#1e3a8a" } }}
            />
            <div className="mt-2 text-xs text-blue-600 font-medium flex items-center justify-between group-hover:underline">
              <span>Đang mở bán: {activeProducts.length}</span>
              <EyeOutlined />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-emerald-50/60 group"
            onClick={() => handleOpenProductKpi("Danh sách sản phẩm đang kinh doanh", activeProducts)}
          >
            <Statistic
              title={<span className="text-xs font-bold uppercase text-emerald-700">Đang kinh doanh</span>}
              value={activeProducts.length}
              suffix={<span className="text-xs text-gray-400 font-normal">mặt hàng</span>}
              prefix={<CheckCircleOutlined className="text-emerald-500 mr-1" />}
              styles={{ content: { fontWeight: 900, color: "#065f46" } }}
            />
            <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center justify-between group-hover:underline">
              <span>Khách có thể đặt ngay</span>
              <EyeOutlined />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-rose-50/60 group"
            onClick={() => handleOpenProductKpi("Danh sách sản phẩm hết hàng hoặc tồn kho = 0", outOfStockProducts)}
          >
            <Statistic
              title={<span className="text-xs font-bold uppercase text-rose-700">Hết hàng / Tồn = 0</span>}
              value={outOfStockProducts.length}
              suffix={<span className="text-xs text-gray-400 font-normal">mặt hàng</span>}
              prefix={<WarningOutlined className="text-rose-500 mr-1" />}
              styles={{ content: { fontWeight: 900, color: "#9f1239" } }}
            />
            <div className="mt-2 text-xs text-rose-600 font-medium flex items-center justify-between group-hover:underline">
              <span>Cần bổ sung kho</span>
              <EyeOutlined />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-purple-50/60 group"
            onClick={() => handleOpenProductKpi("Danh sách sản phẩm bán chạy nhất", topSellersProducts)}
          >
            <Statistic
              title={<span className="text-xs font-bold uppercase text-purple-700">Doanh thu Shop (ước tính)</span>}
              value={totalRev}
              formatter={(v) => formatCurrency(v)}
              prefix={<DollarOutlined className="text-purple-500 mr-1" />}
              styles={{ content: { fontWeight: 900, color: "#581c87" } }}
            />
            <div className="mt-2 text-xs text-purple-600 font-medium flex items-center justify-between group-hover:underline">
              <span>Xem Top sản phẩm bán chạy</span>
              <EyeOutlined />
            </div>
          </Card>
        </Col>
      </Row>

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

      {/* ── MODAL: KPI PRODUCTS DRILL-DOWN ────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-2 font-bold text-gray-800">
            <ShoppingOutlined className="text-blue-600" />
            <span>{kpiProductModalTitle} ({kpiProductModalList.length})</span>
          </div>
        }
        open={kpiProductModalOpen}
        onCancel={() => setKpiProductModalOpen(false)}
        footer={null}
        width={850}
        centered
        destroyOnHidden
      >
        <div className="mt-4">
          <Table
            dataSource={kpiProductModalList}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 6 }}
            columns={[
              {
                title: "Sản phẩm",
                dataIndex: "name",
                render: (v, r) => (
                  <div className="flex items-center gap-2">
                    <img
                      src={r.imageUrl}
                      alt={v}
                      className="w-9 h-9 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                    />
                    <div>
                      <div className="font-bold text-xs text-gray-900">{v}</div>
                      <div className="text-[10px] text-gray-400">ID: {r.id}</div>
                    </div>
                  </div>
                ),
              },
              {
                title: "Giá",
                dataIndex: "price",
                render: (v) => <span className="font-bold text-xs text-blue-700">{formatCurrency(v)}đ</span>,
              },
              {
                title: "Tồn kho",
                dataIndex: "stockQuantity",
                render: (v) => (
                  <Tag color={v <= 0 ? "error" : v < 10 ? "warning" : "success"}>
                    {v} cái
                  </Tag>
                ),
              },
              {
                title: "Đã bán",
                dataIndex: "soldCount",
                render: (v) => <span className="font-semibold text-xs">{v || 0} cái</span>,
              },
              {
                title: "Trạng thái",
                dataIndex: "active",
                render: (v) => <Tag color={v !== false ? "success" : "default"}>{v !== false ? "Đang bán" : "Tạm ẩn"}</Tag>,
              },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}
