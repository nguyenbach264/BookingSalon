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
  Avatar,
  Divider,
  Descriptions,
  Empty,
  Spin,
} from "antd";
import {
  UserAddOutlined,
  ScissorOutlined,
  StopOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  CalculatorOutlined,
  SettingOutlined,
  EyeOutlined,
  StarFilled,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getAdminStylists,
  promoteUserToStylist,
  terminateStylist,
  assignStylistServices,
  removeStylistService,
  updateStylistSalaryConfig,
  getStylistPayroll,
  getEligibleUsersForPromotion,
  getAdminServices,
} from "../../service/api/adminApi";
import { getSalons } from "../../service/api/salonApi";

const { Option } = Select;
const { RangePicker } = DatePicker;

const AdminStylistManager = () => {
  const [stylists, setStylists] = useState([]);
  const [salons, setSalons] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const [promoteModalVisible, setPromoteModalVisible] = useState(false);
  const [promoteLoading, setPromoteLoading] = useState(false);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentStylist, setCurrentStylist] = useState(null);

  const [terminateModalVisible, setTerminateModalVisible] = useState(false);
  const [terminatingStylist, setTerminatingStylist] = useState(null);
  const [terminateLoading, setTerminateLoading] = useState(false);

  const [servicesModalVisible, setServicesModalVisible] = useState(false);
  const [assignServicesLoading, setAssignServicesLoading] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);

  const [salaryModalVisible, setSalaryModalVisible] = useState(false);
  const [salaryLoading, setSalaryLoading] = useState(false);

  const [payrollModalVisible, setPayrollModalVisible] = useState(false);
  const [payrollData, setPayrollData] = useState(null);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [payrollDateRange, setPayrollDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);

  const [promoteForm] = Form.useForm();
  const [terminateForm] = Form.useForm();
  const [salaryForm] = Form.useForm();

  const fetchStylists = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedSalon) params.salonId = selectedSalon;
      if (selectedStatus && selectedStatus !== "ALL") params.status = selectedStatus;

      const data = await getAdminStylists(params);
      setStylists(data || []);
    } catch (err) {
      message.error("Lỗi khi tải danh sách Stylist: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [search, selectedSalon, selectedStatus]);

  useEffect(() => {
    fetchStylists();
  }, [fetchStylists]);

  useEffect(() => {
    getSalons()
      .then((res) => setSalons(res || []))
      .catch((err) => console.error("Error loading salons", err));
    getAdminServices()
      .then((res) => setAvailableServices(res || []))
      .catch((err) => console.error("Error loading services", err));
  }, []);

  const handleSearchUsers = async (val) => {
    setSearchingUsers(true);
    try {
      const res = await getEligibleUsersForPromotion({ search: val });
      setEligibleUsers(res !== null ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingUsers(false);
    }
  };

  const openPromoteModal = () => {
    promoteForm.resetFields();
    promoteForm.setFieldsValue({
      commissionRate: 30.0,
      baseSalary: 8000000,
      levelRank: "SENIOR",
      workShiftType: "FULL_TIME",
    });
    handleSearchUsers("");
    setPromoteModalVisible(true);
  };

  const handlePromoteSubmit = async (values) => {
    setPromoteLoading(true);
    try {
      await promoteUserToStylist(values);
      message.success("Đã thăng cấp người dùng lên Stylist thành công!");
      setPromoteModalVisible(false);
      fetchStylists();
    } catch (err) {
      message.error("Lỗi khi thăng cấp: " + (err.response?.data?.message || err.message));
    } finally {
      setPromoteLoading(false);
    }
  };

  const openTerminateModal = (stylist) => {
    setTerminatingStylist(stylist);
    terminateForm.resetFields();
    terminateForm.setFieldsValue({
      leaveDate: dayjs(),
      reason: "Nghỉ việc theo nguyện vọng cá nhân",
    });
    setTerminateModalVisible(true);
  };

  const handleTerminateSubmit = async (values) => {
    if (!terminatingStylist) return;
    setTerminateLoading(true);
    try {
      const payload = {
        leaveDate: values.leaveDate ? values.leaveDate.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
        reason: values.reason,
        reassignToStylistId: values.reassignToStylistId || null,
      };
      await terminateStylist(terminatingStylist.id, payload);
      message.success("Đã xử lý cho stylist nghỉ việc thành công!");
      setTerminateModalVisible(false);
      fetchStylists();
    } catch (err) {
      message.error("Lỗi khi xử lý nghỉ việc: " + (err.response?.data?.message || err.message));
    } finally {
      setTerminateLoading(false);
    }
  };

  const openServicesModal = (stylist) => {
    setCurrentStylist(stylist);
    setSelectedServiceIds((stylist.services || []).map((s) => s.id));
    setServicesModalVisible(true);
  };

  const handleSaveServices = async () => {
    if (!currentStylist) return;
    setAssignServicesLoading(true);
    try {
      await assignStylistServices(currentStylist.id, selectedServiceIds);
      message.success("Đã cập nhật danh sách dịch vụ của Stylist!");
      setServicesModalVisible(false);
      fetchStylists();
    } catch (err) {
      message.error("Lỗi khi gán dịch vụ: " + (err.response?.data?.message || err.message));
    } finally {
      setAssignServicesLoading(false);
    }
  };

  const handleRemoveSingleService = async (serviceId) => {
    if (!currentStylist) return;
    try {
      await removeStylistService(currentStylist.id, serviceId);
      message.success("Đã xóa dịch vụ khỏi Stylist!");
      setSelectedServiceIds((prev) => prev.filter((id) => id !== serviceId));
      fetchStylists();
    } catch (err) {
      message.error("Lỗi khi xóa dịch vụ: " + (err.response?.data?.message || err.message));
    }
  };

  const openSalaryModal = (stylist) => {
    setCurrentStylist(stylist);
    salaryForm.setFieldsValue({
      baseSalary: stylist.baseSalary || 0,
      commissionRate: stylist.commissionRate != null ? stylist.commissionRate : 30.0,
      workShiftType: stylist.workShiftType || "FULL_TIME",
    });
    setSalaryModalVisible(true);
  };

  const handleSalarySubmit = async (values) => {
    if (!currentStylist) return;
    setSalaryLoading(true);
    try {
      await updateStylistSalaryConfig(currentStylist.id, values);
      message.success("Đã cập nhật cấu hình lương/thưởng thành công!");
      setSalaryModalVisible(false);
      fetchStylists();
    } catch (err) {
      message.error("Lỗi khi cập nhật lương: " + (err.response?.data?.message || err.message));
    } finally {
      setSalaryLoading(false);
    }
  };

  const openPayrollModal = async (stylist, dates = payrollDateRange) => {
    setCurrentStylist(stylist);
    setPayrollModalVisible(true);
    setPayrollLoading(true);
    try {
      const params = {};
      if (dates && dates[0]) params.startDate = dates[0].format("YYYY-MM-DD");
      if (dates && dates[1]) params.endDate = dates[1].format("YYYY-MM-DD");

      const data = await getStylistPayroll(stylist.id, params);
      setPayrollData(data);
    } catch (err) {
      message.error("Lỗi khi tính toán bảng lương: " + (err.response?.data?.message || err.message));
    } finally {
      setPayrollLoading(false);
    }
  };

  const handlePayrollDateChange = (dates) => {
    setPayrollDateRange(dates);
    if (currentStylist && dates) {
      openPayrollModal(currentStylist, dates);
    }
  };

  const totalCount = stylists.length;
  const activeCount = stylists.filter((s) => s.status === "ACTIVE").length;
  const inactiveCount = stylists.filter((s) => s.status === "INACTIVE").length;

  const columns = [
    {
      title: "Stylist",
      key: "stylist",
      render: (_, r) => (
        <Space size={12}>
          <Avatar
            src={r.avatarUrl}
            size={48}
            className="border-2 border-indigo-200"
            icon={<ScissorOutlined />}
          />
          <div>
            <div className="font-bold text-gray-800 text-sm">{r.fullName || r.username}</div>
            <div className="text-xs text-gray-500 font-mono">{r.phoneNumber || r.email || "—"}</div>
            {r.nickname && (
              <Tag color="cyan" className="text-[11px] mt-0.5">
                Biệt danh: {r.nickname}
              </Tag>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "Salon & Cấp bậc",
      key: "salon_level",
      render: (_, r) => (
        <div>
          <div className="font-semibold text-gray-700 text-xs">{r.salonName || "Chưa phân salon"}</div>
          <div className="mt-1 flex items-center gap-1">
            <Tag color={r.levelRank === "MASTER" ? "gold" : "blue"} className="font-semibold">
              {r.levelRank || "SENIOR"}
            </Tag>
            <Tag color="purple">{r.workShiftType || "FULL_TIME"}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: "Đánh giá & Dịch vụ",
      key: "rating_services",
      render: (_, r) => (
        <div>
          <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
            <StarFilled /> {r.rating ? r.rating.toFixed(1) : "5.0"}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            <Button
              type="link"
              size="small"
              className="p-0 text-blue-600 font-medium"
              onClick={() => openServicesModal(r)}
            >
              {r.services ? r.services.length : 0} dịch vụ đảm nhận
            </Button>
          </div>
        </div>
      ),
    },
    {
      title: "Lương & Hoa hồng",
      key: "salary_rate",
      render: (_, r) => (
        <div>
          <div className="text-xs text-gray-600">
            Lương cứng: <strong className="text-gray-900">{r.baseSalary ? Number(r.baseSalary).toLocaleString("vi-VN") : 0} ₫</strong>
          </div>
          <div className="text-xs text-indigo-600 font-semibold mt-0.5">
            Hoa hồng: <span>{r.commissionRate != null ? r.commissionRate : 30}% / booking</span>
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, r) =>
        r.status === "ACTIVE" ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Đang hoạt động
          </Tag>
        ) : (
          <div>
            <Tag color="error" icon={<StopOutlined />}>
              Đã nghỉ việc
            </Tag>
            {r.leaveDate && <div className="text-[11px] text-gray-400 mt-0.5">Từ: {r.leaveDate}</div>}
          </div>
        ),
    },
    {
      title: "Hành động",
      key: "actions",
      fixed: "right",
      width: 280,
      render: (_, r) => (
        <Space size={6} wrap>
          <Tooltip title="Xem chi tiết Stylist">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setCurrentStylist(r);
                setDetailModalVisible(true);
              }}
            />
          </Tooltip>

          <Tooltip title="Gán / Quản lý dịch vụ đảm nhận">
            <Button
              size="small"
              icon={<ScissorOutlined />}
              onClick={() => openServicesModal(r)}
            >
              Dịch vụ
            </Button>
          </Tooltip>

          <Tooltip title="Cấu hình Lương cơ bản & Tỷ lệ % Thưởng">
            <Button
              size="small"
              icon={<SettingOutlined />}
              onClick={() => openSalaryModal(r)}
            >
              Lương
            </Button>
          </Tooltip>

          <Tooltip title="Tính toán Lương & Hoa hồng 30%">
            <Button
              size="small"
              type="primary"
              className="bg-emerald-600 hover:bg-emerald-500"
              icon={<CalculatorOutlined />}
              onClick={() => openPayrollModal(r)}
            >
              Bảng lương
            </Button>
          </Tooltip>

          {r.status === "ACTIVE" ? (
            <Tooltip title="Cho Stylist nghỉ việc">
              <Button
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => openTerminateModal(r)}
              />
            </Tooltip>
          ) : null}
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
              title={<span className="text-gray-600 font-semibold">Tổng Stylist</span>}
              value={totalCount}
              prefix={<ScissorOutlined className="text-blue-600 mr-2" />}
              valueStyle={{ color: "#1d4ed8", fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="rounded-xl border border-emerald-100 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
            <Statistic
              title={<span className="text-gray-600 font-semibold">Đang làm việc</span>}
              value={activeCount}
              prefix={<CheckCircleOutlined className="text-emerald-600 mr-2" />}
              valueStyle={{ color: "#047857", fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="rounded-xl border border-amber-100 shadow-sm bg-gradient-to-br from-amber-50 to-white">
            <Statistic
              title={<span className="text-gray-600 font-semibold">Đã nghỉ việc</span>}
              value={inactiveCount}
              prefix={<StopOutlined className="text-amber-600 mr-2" />}
              valueStyle={{ color: "#b45309", fontWeight: "bold" }}
            />
          </Card>
        </Col>
      </Row>

      <Card className="rounded-xl border border-gray-100 shadow-sm">
        <Row gutter={[16, 16]} justify="space-between" align="middle">
          <Col xs={24} md={16}>
            <Space size={12} wrap className="w-full">
              <Input
                placeholder="Tìm stylist theo tên, SĐT, biệt danh..."
                prefix={<SearchOutlined className="text-gray-400" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onPressEnter={fetchStylists}
                style={{ width: 240 }}
                allowClear
              />
              <Select
                placeholder="Chọn chi nhánh Salon"
                allowClear
                style={{ width: 200 }}
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
                value={selectedStatus}
                onChange={(val) => setSelectedStatus(val)}
                style={{ width: 150 }}
              >
                <Option value="ALL">Tất cả trạng thái</Option>
                <Option value="ACTIVE">Đang làm việc</Option>
                <Option value="INACTIVE">Đã nghỉ việc</Option>
              </Select>
              <Button icon={<ReloadOutlined />} onClick={fetchStylists}>
                Làm mới
              </Button>
            </Space>
          </Col>
          <Col xs={24} md={8} className="flex justify-end">
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={openPromoteModal}
              className="bg-indigo-600 hover:bg-indigo-500 font-semibold h-10 px-5 rounded-lg"
            >
              Thêm Stylist (Thăng cấp từ User)
            </Button>
          </Col>
        </Row>
      </Card>

      <Card className="rounded-xl border border-gray-100 shadow-sm">
        <Table
          columns={columns}
          dataSource={stylists}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      {/* MODAL: PROMOTE USER */}
      <Modal
        title={
          <Space>
            <UserAddOutlined className="text-indigo-600" />
            <span className="font-bold text-gray-800">Thăng cấp Người dùng thành Stylist</span>
          </Space>
        }
        open={promoteModalVisible}
        onCancel={() => setPromoteModalVisible(false)}
        footer={null}
        width={680}
        destroyOnClose
      >
        <Form form={promoteForm} layout="vertical" onFinish={handlePromoteSubmit}>
          <Form.Item
            name="userId"
            label="Chọn người dùng cần thăng cấp"
            rules={[{ required: true, message: "Vui lòng chọn người dùng" }]}
          >
            <Select
              showSearch
              placeholder="Gõ tên, SĐT hoặc email để tìm kiếm người dùng..."
              filterOption={false}
              onSearch={handleSearchUsers}
              loading={searchingUsers}
              notFoundContent={searchingUsers ? <Spin size="small" /> : <Empty description="Không tìm thấy người dùng" />}
            >
              {eligibleUsers.map((u) => (
                <Option key={u.id} value={u.id}>
                  {u.fullName || u.username} ({u.phoneNumber || u.email || "Không có SĐT"})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="salonId"
                label="Salon phân công làm việc"
                rules={[{ required: true, message: "Vui lòng chọn salon" }]}
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
            <Col span={12}>
              <Form.Item name="nickname" label="Biệt danh Stylist (Nickname)">
                <Input placeholder="VD: David Hải, Ken Nguyễn..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="levelRank" label="Cấp bậc (Rank)">
                <Select>
                  <Option value="JUNIOR">Junior Stylist</Option>
                  <Option value="SENIOR">Senior Stylist</Option>
                  <Option value="MASTER">Master Stylist</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="experienceYears" label="Số năm kinh nghiệm">
                <InputNumber min={0.5} step={0.5} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="workShiftType" label="Ca làm việc">
                <Select>
                  <Option value="FULL_TIME">Toàn thời gian (Full-time)</Option>
                  <Option value="PART_TIME">Bán thời gian (Part-time)</Option>
                  <Option value="WEEKEND_ONLY">Chỉ cuối tuần</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="baseSalary"
                label="Lương cứng (VND/tháng)"
                rules={[{ required: true, message: "Nhập lương cơ bản" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  step={500000}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="commissionRate"
                label="Tỷ lệ hoa hồng (% trên mỗi booking)"
                rules={[{ required: true, message: "Nhập tỷ lệ hoa hồng" }]}
                extra="Mặc định là 30% giá trị mỗi booking hoàn thành"
              >
                <InputNumber min={0} max={100} step={1} addonAfter="%" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="specialties" label="Sở trường / Kỹ thuật chuyên môn">
            <Input placeholder="VD: Uốn layer phồng Hàn Quốc, Cắt Fade Mỹ, Nhuộm tẩy Balayage..." />
          </Form.Item>

          <Form.Item name="bio" label="Mô tả / Tiểu sử ngắn">
            <Input.TextArea rows={2} placeholder="Giới thiệu phong cách làm việc, thành tích..." />
          </Form.Item>

          <Form.Item name="serviceIds" label="Gán các dịch vụ đảm nhận ngay">
            <Select
              mode="multiple"
              placeholder="Chọn các dịch vụ stylist có thể phục vụ"
              allowClear
              optionFilterProp="children"
            >
              {availableServices.map((s) => (
                <Option key={s.id} value={s.id}>
                  {s.name} ({Number(s.price).toLocaleString("vi-VN")} ₫)
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setPromoteModalVisible(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={promoteLoading} className="bg-indigo-600">
              Xác nhận Thăng cấp
            </Button>
          </div>
        </Form>
      </Modal>

      {/* MODAL: TERMINATE */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined className="text-rose-600" />
            <span className="font-bold text-gray-800">Xác nhận cho Stylist nghỉ việc</span>
          </Space>
        }
        open={terminateModalVisible}
        onCancel={() => setTerminateModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        {terminatingStylist && (
          <Form form={terminateForm} layout="vertical" onFinish={handleTerminateSubmit}>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs mb-4">
              <strong>Lưu ý:</strong> Khi cho stylist nghỉ việc, tài khoản sẽ chuyển sang INACTIVE, mất
              quyền Stylist trong hệ thống Keycloak. Các lịch hẹn tương lai sẽ được tự động hủy hoặc chuyển giao.
            </div>

            <p className="font-semibold text-gray-700">
              Stylist: <span className="text-indigo-600 font-bold">{terminatingStylist.fullName}</span>
            </p>

            <Form.Item
              name="leaveDate"
              label="Ngày chính thức nghỉ việc"
              rules={[{ required: true, message: "Chọn ngày nghỉ" }]}
            >
              <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
            </Form.Item>

            <Form.Item
              name="reassignToStylistId"
              label="Chuyển giao các lịch hẹn sắp tới cho Stylist thay thế (Tùy chọn)"
              extra="Nếu để trống, tất cả các lịch hẹn tương lai của thợ này sẽ tự động hủy kèm lý do."
            >
              <Select placeholder="Chọn stylist thay thế cùng salon..." allowClear>
                {stylists
                  .filter((s) => s.id !== terminatingStylist.id && s.status === "ACTIVE")
                  .map((s) => (
                    <Option key={s.id} value={s.id}>
                      {s.fullName} ({s.salonName})
                    </Option>
                  ))}
              </Select>
            </Form.Item>

            <Form.Item name="reason" label="Lý do nghỉ việc">
              <Input.TextArea rows={2} placeholder="VD: Hết hạn hợp đồng, chuyển nơi ở..." />
            </Form.Item>

            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={() => setTerminateModalVisible(false)}>Hủy</Button>
              <Button type="primary" danger htmlType="submit" loading={terminateLoading}>
                Xác nhận Cho nghỉ việc
              </Button>
            </div>
          </Form>
        )}
      </Modal>

      {/* MODAL: ASSIGN SERVICES */}
      <Modal
        title={
          <Space>
            <ScissorOutlined className="text-indigo-600" />
            <span className="font-bold text-gray-800">
              Quản lý Dịch vụ đảm nhận - {currentStylist?.fullName}
            </span>
          </Space>
        }
        open={servicesModalVisible}
        onCancel={() => setServicesModalVisible(false)}
        onOk={handleSaveServices}
        confirmLoading={assignServicesLoading}
        width={650}
        destroyOnClose
      >
        <p className="text-xs text-gray-500 mb-3">
          Chọn các dịch vụ mà Stylist này có tay nghề phục vụ khách hàng.
        </p>

        <Select
          mode="multiple"
          style={{ width: "100%" }}
          placeholder="Chọn các dịch vụ..."
          value={selectedServiceIds}
          onChange={(vals) => setSelectedServiceIds(vals)}
          optionFilterProp="children"
        >
          {availableServices.map((s) => (
            <Option key={s.id} value={s.id}>
              {s.name} - {Number(s.price).toLocaleString("vi-VN")} ₫ ({s.duration} phút)
            </Option>
          ))}
        </Select>

        <Divider orientation="left" className="text-xs font-semibold text-gray-500">
          Dịch vụ đang đảm nhận ({selectedServiceIds.length})
        </Divider>

        <div className="max-h-60 overflow-y-auto space-y-2">
          {selectedServiceIds.map((sid) => {
            const srv = availableServices.find((s) => s.id === sid);
            if (!srv) return null;
            return (
              <div
                key={sid}
                className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg border border-gray-100 text-xs"
              >
                <div>
                  <span className="font-bold text-gray-800">{srv.name}</span>
                  <span className="text-gray-400 ml-2">({srv.duration} phút)</span>
                  <span className="text-indigo-600 font-semibold ml-2">
                    {Number(srv.price).toLocaleString("vi-VN")} ₫
                  </span>
                </div>
                <Button
                  size="small"
                  type="text"
                  danger
                  onClick={() => handleRemoveSingleService(sid)}
                >
                  Xóa
                </Button>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* MODAL: SALARY CONFIG */}
      <Modal
        title={
          <Space>
            <SettingOutlined className="text-emerald-600" />
            <span className="font-bold text-gray-800">
              Cấu hình Lương & Thưởng - {currentStylist?.fullName}
            </span>
          </Space>
        }
        open={salaryModalVisible}
        onCancel={() => setSalaryModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={salaryForm} layout="vertical" onFinish={handleSalarySubmit}>
          <Form.Item
            name="baseSalary"
            label="Lương cứng (VND/tháng)"
            rules={[{ required: true, message: "Nhập lương cơ bản" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              step={500000}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
            />
          </Form.Item>

          <Form.Item
            name="commissionRate"
            label="Tỷ lệ hoa hồng (% doanh thu booking hoàn thành)"
            rules={[{ required: true, message: "Nhập tỷ lệ hoa hồng" }]}
            extra="Quy định tiêu chuẩn: 30% giá trị các đơn booking cắt tóc & dịch vụ"
          >
            <InputNumber min={0} max={100} step={1} addonAfter="%" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="workShiftType" label="Chế độ làm việc">
            <Select>
              <Option value="FULL_TIME">Toàn thời gian (Full-time)</Option>
              <Option value="PART_TIME">Bán thời gian (Part-time)</Option>
              <Option value="WEEKEND_ONLY">Chỉ cuối tuần</Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setSalaryModalVisible(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={salaryLoading} className="bg-emerald-600">
              Lưu cấu hình
            </Button>
          </div>
        </Form>
      </Modal>

      {/* MODAL: PAYROLL */}
      <Modal
        title={
          <Space>
            <CalculatorOutlined className="text-indigo-600" />
            <span className="font-bold text-gray-800">
              Bảng tính Lương & Thưởng Hoa hồng: {currentStylist?.fullName}
            </span>
          </Space>
        }
        open={payrollModalVisible}
        onCancel={() => setPayrollModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPayrollModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={900}
        destroyOnClose
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
            <span className="text-xs font-semibold text-gray-700">Chọn chu kỳ tính lương:</span>
            <RangePicker
              value={payrollDateRange}
              onChange={handlePayrollDateChange}
              format="YYYY-MM-DD"
              allowClear={false}
            />
          </div>

          {payrollLoading ? (
            <div className="text-center py-10">
              <Spin tip="Đang tính toán doanh thu và hoa hồng..." />
            </div>
          ) : payrollData ? (
            <>
              <Row gutter={[12, 12]}>
                <Col xs={12} sm={6}>
                  <Card size="small" className="bg-blue-50 border-blue-200">
                    <Statistic
                      title={<span className="text-xs text-gray-600">Lương cứng</span>}
                      value={Number(payrollData.baseSalary || 0).toLocaleString("vi-VN") + " ₫"}
                      valueStyle={{ fontSize: 16, fontWeight: "bold", color: "#1d4ed8" }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small" className="bg-amber-50 border-amber-200">
                    <Statistic
                      title={<span className="text-xs text-gray-600">Doanh thu ({payrollData.completedBookingsCount} đơn)</span>}
                      value={Number(payrollData.totalCompletedBookingRevenue || 0).toLocaleString("vi-VN") + " ₫"}
                      valueStyle={{ fontSize: 16, fontWeight: "bold", color: "#b45309" }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small" className="bg-emerald-50 border-emerald-200">
                    <Statistic
                      title={<span className="text-xs text-gray-600">Thưởng {payrollData.commissionRate}%</span>}
                      value={Number(payrollData.commissionBonus || 0).toLocaleString("vi-VN") + " ₫"}
                      valueStyle={{ fontSize: 16, fontWeight: "bold", color: "#047857" }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small" className="bg-indigo-50 border-indigo-300 shadow-sm">
                    <Statistic
                      title={<span className="text-xs font-bold text-indigo-700">TỔNG LƯƠNG NHẬN</span>}
                      value={Number(payrollData.totalSalary || 0).toLocaleString("vi-VN") + " ₫"}
                      valueStyle={{ fontSize: 18, fontWeight: "extrabold", color: "#4338ca" }}
                    />
                  </Card>
                </Col>
              </Row>

              <Divider orientation="left" className="text-xs font-semibold text-gray-500">
                Chi tiết các Booking hoàn thành ({payrollData.bookingDetails?.length || 0})
              </Divider>

              <Table
                dataSource={payrollData.bookingDetails || []}
                rowKey="bookingId"
                size="small"
                pagination={{ pageSize: 5 }}
                columns={[
                  {
                    title: "Mã đơn",
                    dataIndex: "bookingCode",
                    key: "bookingCode",
                    render: (c) => <span className="font-mono text-xs font-bold text-blue-700">{c}</span>,
                  },
                  {
                    title: "Khách hàng",
                    key: "customer",
                    render: (_, r) => (
                      <div>
                        <div className="font-semibold text-xs text-gray-800">{r.customerName}</div>
                        <div className="text-[11px] text-gray-400">{r.customerPhone}</div>
                      </div>
                    ),
                  },
                  {
                    title: "Thời gian",
                    dataIndex: "startTime",
                    key: "startTime",
                    render: (t) => <span className="text-xs text-gray-600">{t ? dayjs(t).format("DD/MM/YYYY HH:mm") : "—"}</span>,
                  },
                  {
                    title: "Dịch vụ đã làm",
                    dataIndex: "serviceNames",
                    key: "serviceNames",
                    render: (names) => (
                      <div className="flex flex-wrap gap-1">
                        {(names || []).map((n, idx) => (
                          <Tag key={idx} color="default" className="text-[11px]">
                            {n}
                          </Tag>
                        ))}
                      </div>
                    ),
                  },
                  {
                    title: "Giá trị đơn",
                    dataIndex: "totalAmount",
                    key: "totalAmount",
                    render: (v) => <span className="text-xs font-bold">{Number(v || 0).toLocaleString("vi-VN")} ₫</span>,
                  },
                  {
                    title: "Hoa hồng 30%",
                    dataIndex: "bookingCommission",
                    key: "bookingCommission",
                    render: (v) => <span className="text-xs font-bold text-emerald-700">+{Number(v || 0).toLocaleString("vi-VN")} ₫</span>,
                  },
                ]}
              />
            </>
          ) : (
            <Empty description="Không có dữ liệu trong khoảng thời gian này" />
          )}
        </div>
      </Modal>

      {/* MODAL: DETAIL */}
      <Modal
        title="Thông tin chi tiết Stylist"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={650}
      >
        {currentStylist && (
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Họ và tên" span={2}>
              <strong className="text-indigo-700">{currentStylist.fullName}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Biệt danh">{currentStylist.nickname || "—"}</Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">{currentStylist.phoneNumber || "—"}</Descriptions.Item>
            <Descriptions.Item label="Email" span={2}>{currentStylist.email || "—"}</Descriptions.Item>
            <Descriptions.Item label="Chi nhánh">{currentStylist.salonName || "—"}</Descriptions.Item>
            <Descriptions.Item label="Cấp bậc">{currentStylist.levelRank || "SENIOR"}</Descriptions.Item>
            <Descriptions.Item label="Ca làm việc">{currentStylist.workShiftType || "FULL_TIME"}</Descriptions.Item>
            <Descriptions.Item label="Lương cứng">
              {Number(currentStylist.baseSalary || 0).toLocaleString("vi-VN")} ₫
            </Descriptions.Item>
            <Descriptions.Item label="Tỷ lệ hoa hồng">{currentStylist.commissionRate != null ? currentStylist.commissionRate : 30}%</Descriptions.Item>
            <Descriptions.Item label="Ngày gia nhập">{currentStylist.joinDate || "—"}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={currentStylist.status === "ACTIVE" ? "success" : "error"}>
                {currentStylist.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Lịch hẹn sắp tới">{currentStylist.activeBookingsCount || 0} lịch</Descriptions.Item>
            <Descriptions.Item label="Tiểu sử / Giới thiệu" span={2}>
              {currentStylist.bio || "Chưa có tiểu sử"}
            </Descriptions.Item>
            <Descriptions.Item label="Chuyên môn" span={2}>
              {currentStylist.specialties || "—"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default AdminStylistManager;
