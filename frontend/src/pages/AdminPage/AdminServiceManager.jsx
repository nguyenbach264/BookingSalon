import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Card,
  Row,
  Col,
  Statistic,
  message,
  Tooltip,
  Image,
  Popconfirm,
  Alert,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  ShopOutlined,
  AppstoreOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getAdminServices,
  createAdminService,
  updateAdminService,
  deleteAdminService,
  createServiceSuspension,
  getServiceSuspensions,
  deactivateServiceSuspension,
} from "../../service/api/adminApi";
import { getSalons } from "../../service/api/salonApi";
import { getServiceCategories } from "../../service/api/serviceApi";

const { Option } = Select;
const { RangePicker } = DatePicker;

const AdminServiceManager = () => {
  const [services, setServices] = useState([]);
  const [salons, setSalons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentServiceId, setCurrentServiceId] = useState(null);
  const [serviceModalLoading, setServiceModalLoading] = useState(false);

  const [suspendModalVisible, setSuspendModalVisible] = useState(false);
  const [suspendingService, setSuspendingService] = useState(null);
  const [suspendLoading, setSuspendLoading] = useState(false);

  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [suspensionsList, setSuspensionsList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [serviceForm] = Form.useForm();
  const [suspendForm] = Form.useForm();

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedSalon) params.salonId = selectedSalon;
      if (selectedCategory) params.categoryId = selectedCategory;

      const data = await getAdminServices(params);
      setServices(data || []);
    } catch (err) {
      message.error("Lỗi khi tải danh sách dịch vụ: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [search, selectedSalon, selectedCategory]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    getSalons()
      .then((res) => setSalons(res || []))
      .catch((err) => console.error("Error loading salons", err));

    getServiceCategories()
      .then((res) => setCategories(res || []))
      .catch((err) => console.error("Error loading categories", err));
  }, []);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setCurrentServiceId(null);
    serviceForm.resetFields();
    if (salons.length > 0) serviceForm.setFieldValue("salonId", salons[0].id);
    if (categories.length > 0) serviceForm.setFieldValue("categoryId", categories[0].id);
    serviceForm.setFieldValue("duration", 45);
    setServiceModalVisible(true);
  };

  const handleOpenEditModal = (service) => {
    setIsEditing(true);
    setCurrentServiceId(service.id);
    serviceForm.setFieldsValue({
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      image: service.image,
      salonId: service.salonId,
      categoryId: service.categoryId,
    });
    setServiceModalVisible(true);
  };

  const handleServiceSubmit = async (values) => {
    setServiceModalLoading(true);
    try {
      if (isEditing) {
        await updateAdminService(currentServiceId, values);
        message.success("Đã cập nhật dịch vụ thành công!");
      } else {
        await createAdminService(values);
        message.success("Đã tạo mới dịch vụ thành công!");
      }
      setServiceModalVisible(false);
      fetchServices();
    } catch (err) {
      message.error("Lỗi khi lưu dịch vụ: " + (err.response?.data?.message || err.message));
    } finally {
      setServiceModalLoading(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    try {
      await deleteAdminService(serviceId);
      message.success("Đã xóa dịch vụ thành công!");
      fetchServices();
    } catch (err) {
      message.error("Lỗi khi xóa dịch vụ: " + (err.response?.data?.message || err.message));
    }
  };

  const handleOpenSuspendModal = (service) => {
    setSuspendingService(service);
    suspendForm.resetFields();
    suspendForm.setFieldsValue({
      salonIds: service.salonId ? [service.salonId] : salons.map((s) => s.id),
      timeRange: [dayjs(), dayjs().add(7, "day")],
      reason: "Bảo trì nâng cấp thiết bị và đào tạo kỹ thuật mới",
    });
    setSuspendModalVisible(true);
  };

  const handleSuspendSubmit = async (values) => {
    if (!suspendingService) return;
    setSuspendLoading(true);
    try {
      const payload = {
        serviceOfferingId: suspendingService.id,
        salonIds: values.salonIds,
        startTime: values.timeRange[0].format("YYYY-MM-DD HH:mm:ss"),
        endTime: values.timeRange[1].format("YYYY-MM-DD HH:mm:ss"),
        reason: values.reason,
      };

      await createServiceSuspension(payload);
      message.success(
        `Đã tạo lịch vô hiệu hóa dịch vụ tại ${values.salonIds.length} salon thành công!`
      );
      setSuspendModalVisible(false);
      fetchServices();
    } catch (err) {
      message.error("Lỗi khi cấu hình tạm dừng: " + (err.response?.data?.message || err.message));
    } finally {
      setSuspendLoading(false);
    }
  };

  const handleOpenHistoryModal = async () => {
    setHistoryModalVisible(true);
    setHistoryLoading(true);
    try {
      const res = await getServiceSuspensions();
      setSuspensionsList(res || []);
    } catch (err) {
      message.error("Lỗi khi tải lịch sử tạm dừng: " + (err.response?.data?.message || err.message));
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleReactivateSuspension = async (suspensionId) => {
    try {
      await deactivateServiceSuspension(suspensionId);
      message.success("Đã kích hoạt lại dịch vụ sớm thành công!");
      const res = await getServiceSuspensions();
      setSuspensionsList(res || []);
      fetchServices();
    } catch (err) {
      message.error("Lỗi khi mở lại dịch vụ: " + (err.response?.data?.message || err.message));
    }
  };

  const totalCount = services.length;
  const suspendedCount = services.filter((s) => s.isSuspended).length;
  const activeCount = totalCount - suspendedCount;

  const columns = [
    {
      title: "Ảnh",
      dataIndex: "image",
      key: "image",
      width: 70,
      render: (img) => (
        <Image
          src={img || "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=100"}
          alt="service"
          width={48}
          height={48}
          className="rounded-lg object-cover border border-gray-200"
          fallback="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=100"
        />
      ),
    },
    {
      title: "Tên & Mô tả Dịch vụ",
      key: "name_desc",
      render: (_, r) => (
        <div>
          <div className="font-bold text-gray-800 text-sm">{r.name}</div>
          <div className="text-xs text-gray-500 line-clamp-1 max-w-sm mt-0.5">
            {r.description || "Không có mô tả"}
          </div>
        </div>
      ),
    },
    {
      title: "Danh mục & Salon",
      key: "category_salon",
      render: (_, r) => {
        const salon = salons.find((s) => s.id === r.salonId);
        const cat = categories.find((c) => c.id === r.categoryId);
        return (
          <div>
            <Tag color="cyan" className="font-semibold text-xs">
              {cat ? cat.categoryName : "Chưa phân loại"}
            </Tag>
            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <ShopOutlined /> {salon ? salon.salonName : "Tất cả chi nhánh"}
            </div>
          </div>
        );
      },
    },
    {
      title: "Giá dịch vụ",
      dataIndex: "price",
      key: "price",
      render: (v) => (
        <span className="font-bold text-indigo-700 text-xs">
          {Number(v || 0).toLocaleString("vi-VN")} ₫
        </span>
      ),
    },
    {
      title: "Thời lượng",
      dataIndex: "duration",
      key: "duration",
      render: (v) => (
        <span className="text-xs text-gray-600 font-medium">
          <ClockCircleOutlined className="mr-1 text-gray-400" />
          {v} phút
        </span>
      ),
    },
    {
      title: "Trạng thái phục vụ",
      key: "status",
      render: (_, r) =>
        r.isSuspended ? (
          <div>
            <Tag color="warning" icon={<PauseCircleOutlined />}>
              Đang tạm dừng
            </Tag>
            {r.suspensionReason && (
              <div className="text-[11px] text-amber-700 max-w-xs mt-0.5 line-clamp-1">
                Lý do: {r.suspensionReason}
              </div>
            )}
          </div>
        ) : (
          <Tag color="success">Sẵn sàng phục vụ</Tag>
        ),
    },
    {
      title: "Hành động",
      key: "actions",
      fixed: "right",
      width: 240,
      render: (_, r) => (
        <Space size={6}>
          <Tooltip title="Chỉnh sửa thông tin">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenEditModal(r)}
            />
          </Tooltip>

          <Tooltip title="Vô hiệu hóa / Tạm dừng tại 1 hay nhiều salon theo khoảng thời gian">
            <Button
              size="small"
              type={r.isSuspended ? "default" : "dashed"}
              icon={<PauseCircleOutlined />}
              className={r.isSuspended ? "text-amber-600 border-amber-300" : ""}
              onClick={() => handleOpenSuspendModal(r)}
            >
              Tạm dừng
            </Button>
          </Tooltip>

          <Popconfirm
            title="Xác nhận xóa dịch vụ này?"
            description="Dịch vụ sẽ bị ẩn khỏi danh sách đặt lịch của khách hàng."
            onConfirm={() => handleDeleteService(r.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa dịch vụ">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="rounded-xl border border-blue-100 shadow-sm bg-gradient-to-br from-blue-50 to-white">
            <Statistic
              title={<span className="text-gray-600 font-semibold">Tổng số Dịch vụ</span>}
              value={totalCount}
              prefix={<AppstoreOutlined className="text-blue-600 mr-2" />}
              valueStyle={{ color: "#1d4ed8", fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="rounded-xl border border-emerald-100 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
            <Statistic
              title={<span className="text-gray-600 font-semibold">Đang hoạt động bình thường</span>}
              value={activeCount}
              prefix={<PlayCircleOutlined className="text-emerald-600 mr-2" />}
              valueStyle={{ color: "#047857", fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="rounded-xl border border-amber-100 shadow-sm bg-gradient-to-br from-amber-50 to-white">
            <Statistic
              title={<span className="text-gray-600 font-semibold">Đang tạm dừng theo lịch</span>}
              value={suspendedCount}
              prefix={<PauseCircleOutlined className="text-amber-600 mr-2" />}
              valueStyle={{ color: "#b45309", fontWeight: "bold" }}
            />
          </Card>
        </Col>
      </Row>

      <Card className="rounded-xl border border-gray-100 shadow-sm">
        <Row gutter={[16, 16]} justify="space-between" align="middle">
          <Col xs={24} md={15}>
            <Space size={12} wrap className="w-full">
              <Input
                placeholder="Tìm kiếm dịch vụ theo tên, mô tả..."
                prefix={<SearchOutlined className="text-gray-400" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onPressEnter={fetchServices}
                style={{ width: 220 }}
                allowClear
              />
              <Select
                placeholder="Lọc theo Salon"
                allowClear
                style={{ width: 180 }}
                value={selectedSalon}
                onChange={(val) => setSelectedSalon(val)}
              >
                {salons.map((s) => (
                  <Option key={s.id} value={s.id}>
                    {s.salonName}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="Lọc theo Danh mục"
                allowClear
                style={{ width: 170 }}
                value={selectedCategory}
                onChange={(val) => setSelectedCategory(val)}
              >
                {categories.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.categoryName}
                  </Option>
                ))}
              </Select>
              <Button icon={<ReloadOutlined />} onClick={fetchServices}>
                Làm mới
              </Button>
            </Space>
          </Col>
          <Col xs={24} md={9} className="flex justify-end gap-2">
            <Button
              icon={<HistoryOutlined />}
              onClick={handleOpenHistoryModal}
              className="h-10 px-4 rounded-lg font-medium"
            >
              Lịch sử Tạm dừng
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreateModal}
              className="bg-indigo-600 hover:bg-indigo-500 font-semibold h-10 px-4 rounded-lg"
            >
              Thêm Dịch vụ mới
            </Button>
          </Col>
        </Row>
      </Card>

      <Card className="rounded-xl border border-gray-100 shadow-sm">
        <Table
          columns={columns}
          dataSource={services}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      {/* MODAL: CREATE / EDIT */}
      <Modal
        title={
          <Space>
            {isEditing ? <EditOutlined className="text-indigo-600" /> : <PlusOutlined className="text-indigo-600" />}
            <span className="font-bold text-gray-800">
              {isEditing ? "Chỉnh sửa thông tin Dịch vụ" : "Thêm mới Dịch vụ Salon"}
            </span>
          </Space>
        }
        open={serviceModalVisible}
        onCancel={() => setServiceModalVisible(false)}
        footer={null}
        width={650}
        destroyOnClose
      >
        <Form form={serviceForm} layout="vertical" onFinish={handleServiceSubmit}>
          <Form.Item
            name="name"
            label="Tên dịch vụ"
            rules={[{ required: true, message: "Vui lòng nhập tên dịch vụ" }]}
          >
            <Input placeholder="VD: Cắt tóc nam chuẩn Salon phong cách Undercut / Sidepart..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="categoryId"
                label="Danh mục dịch vụ"
                rules={[{ required: true, message: "Chọn danh mục" }]}
              >
                <Select placeholder="Chọn danh mục">
                  {categories.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.categoryName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="salonId"
                label="Chi nhánh Salon phụ trách"
                rules={[{ required: true, message: "Chọn salon" }]}
              >
                <Select placeholder="Chọn salon">
                  {salons.map((s) => (
                    <Option key={s.id} value={s.id}>
                      {s.salonName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Giá dịch vụ (VND)"
                rules={[{ required: true, message: "Nhập giá dịch vụ" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  step={10000}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="duration"
                label="Thời lượng thực hiện (Phút)"
                rules={[{ required: true, message: "Nhập thời lượng" }]}
              >
                <InputNumber min={5} step={5} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="image" label="URL hình ảnh minh họa">
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item name="description" label="Mô tả chi tiết các bước dịch vụ">
            <Input.TextArea rows={3} placeholder="VD: 1. Tư vấn kiểu tóc, 2. Gội đầu massage dưỡng sinh, 3. Cắt tạo kiểu..." />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setServiceModalVisible(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={serviceModalLoading} className="bg-indigo-600">
              {isEditing ? "Lưu thay đổi" : "Tạo dịch vụ"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* MODAL: SUSPEND */}
      <Modal
        title={
          <Space>
            <PauseCircleOutlined className="text-amber-600" />
            <span className="font-bold text-gray-800">
              Vô hiệu hóa Dịch vụ: {suspendingService?.name}
            </span>
          </Space>
        }
        open={suspendModalVisible}
        onCancel={() => setSuspendModalVisible(false)}
        footer={null}
        width={650}
        destroyOnClose
      >
        <Form form={suspendForm} layout="vertical" onFinish={handleSuspendSubmit}>
          <Alert
            message="Cấu hình khoảng thời gian vô hiệu hóa"
            description="Trong khoảng thời gian này, khách hàng không thể chọn dịch vụ này khi đặt lịch tại các chi nhánh được chỉ định. Khi hết thời gian cấu hình, dịch vụ sẽ tự động mở lại."
            type="warning"
            showIcon
            className="mb-4 text-xs"
          />

          <Form.Item
            name="salonIds"
            label="Áp dụng vô hiệu hóa tại các Salon"
            rules={[{ required: true, message: "Chọn ít nhất 1 salon" }]}
            extra="Bạn có thể chọn 1 chi nhánh hoặc áp dụng đồng loạt cho nhiều chi nhánh"
          >
            <Select mode="multiple" placeholder="Chọn các chi nhánh..." optionFilterProp="children">
              {salons.map((s) => (
                <Option key={s.id} value={s.id}>
                  {s.salonName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="timeRange"
            label="Khoảng thời gian vô hiệu hóa (Từ ngày giờ - Đến ngày giờ)"
            rules={[{ required: true, message: "Chọn khoảng thời gian bắt đầu và kết thúc" }]}
          >
            <RangePicker
              showTime={{ format: "HH:mm" }}
              format="YYYY-MM-DD HH:mm"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Lý do vô hiệu hóa (Hiển thị cho quản trị viên và thông báo khách hàng)"
            rules={[{ required: true, message: "Nhập lý do" }]}
          >
            <Input.TextArea
              rows={2}
              placeholder="VD: Thiếu hóa chất uốn/nhuộm độc quyền, máy móc đang bảo dưỡng định kỳ..."
            />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setSuspendModalVisible(false)}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={suspendLoading}
              className="bg-amber-600 hover:bg-amber-500"
            >
              Kích hoạt Vô hiệu hóa
            </Button>
          </div>
        </Form>
      </Modal>

      {/* MODAL: HISTORY */}
      <Modal
        title={
          <Space>
            <HistoryOutlined className="text-indigo-600" />
            <span className="font-bold text-gray-800">Lịch sử Vô hiệu hóa Dịch vụ</span>
          </Space>
        }
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setHistoryModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={900}
        destroyOnClose
      >
        <Table
          dataSource={suspensionsList}
          rowKey="id"
          loading={historyLoading}
          size="small"
          pagination={{ pageSize: 6 }}
          columns={[
            {
              title: "Dịch vụ",
              dataIndex: "serviceOfferingName",
              key: "serviceOfferingName",
              render: (v) => <strong className="text-gray-800 text-xs">{v}</strong>,
            },
            {
              title: "Chi nhánh áp dụng",
              dataIndex: "salonName",
              key: "salonName",
              render: (v) => <span className="text-xs text-gray-600">{v}</span>,
            },
            {
              title: "Thời gian tạm dừng",
              key: "time",
              render: (_, r) => (
                <div className="text-xs">
                  <div>
                    Bắt đầu: <span className="font-semibold">{dayjs(r.startTime).format("DD/MM/YYYY HH:mm")}</span>
                  </div>
                  <div>
                    Kết thúc: <span className="font-semibold">{dayjs(r.endTime).format("DD/MM/YYYY HH:mm")}</span>
                  </div>
                </div>
              ),
            },
            {
              title: "Lý do",
              dataIndex: "reason",
              key: "reason",
              render: (v) => <span className="text-xs text-gray-500">{v || "—"}</span>,
            },
            {
              title: "Tình trạng",
              key: "active_status",
              render: (_, r) => {
                const now = dayjs();
                const isOngoing = r.active && now.isAfter(dayjs(r.startTime)) && now.isBefore(dayjs(r.endTime));
                if (!r.active) {
                  return <Tag color="default">Đã mở lại sớm</Tag>;
                }
                if (now.isAfter(dayjs(r.endTime))) {
                  return <Tag color="default">Đã hết hạn tự động</Tag>;
                }
                if (isOngoing) {
                  return <Tag color="error">Đang bị vô hiệu hóa</Tag>;
                }
                return <Tag color="warning">Sắp diễn ra</Tag>;
              },
            },
            {
              title: "Thao tác",
              key: "action",
              render: (_, r) =>
                r.active && dayjs().isBefore(dayjs(r.endTime)) ? (
                  <Popconfirm
                    title="Mở lại dịch vụ này ngay lập tức?"
                    description="Hủy bỏ lệnh tạm dừng trước thời hạn kết thúc ban đầu."
                    onConfirm={() => handleReactivateSuspension(r.id)}
                    okText="Mở lại"
                    cancelText="Hủy"
                  >
                    <Button size="small" type="primary" className="bg-emerald-600 text-[11px]">
                      Mở lại sớm
                    </Button>
                  </Popconfirm>
                ) : null,
            },
          ]}
        />
      </Modal>
    </div>
  );
};

export default AdminServiceManager;
