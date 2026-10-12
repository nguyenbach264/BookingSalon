import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Row,
  Col,
  Card,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  TimePicker,
  Switch,
  message,
  Popconfirm,
  Statistic,
  Progress,
  Badge,
  Table,
  Avatar,
  Tabs,
  Empty,
} from "antd";
import {
  ShopOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  EditOutlined,
  StopOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  UserAddOutlined,
  TeamOutlined,
  CalendarOutlined,
  DollarOutlined,
  RightOutlined,
  SearchOutlined,
  DeleteOutlined,
  SwapOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { createSalon, updateSalon, deleteSalon } from "../../../service/api/salonApi";
import { assignStylistToSalon, removeStylistFromSalon } from "../../../service/api/adminApi";

const { Option } = Select;

const formatCurrency = (val) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val ?? 0);

export default function AdminSalonsView({
  salons = [],
  stylists = [],
  bookings = [],
  onReloadSalons,
  onOpenAddStylistModal,
}) {
  const navigate = useNavigate();

  // Modal create/edit salon
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSalon, setEditingSalon] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Modal Thêm/Xóa Stylist cho Salon
  const [stylistModalOpen, setStylistModalOpen] = useState(false);
  const [activeSalonForStylists, setActiveSalonForStylists] = useState(null);
  const [stylistModalTab, setStylistModalTab] = useState("available"); // "available" hoặc "current"
  const [stylistSearch, setStylistSearch] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const handleOpenStylistModal = (salon, tab = "available") => {
    setActiveSalonForStylists(salon);
    setStylistModalTab(tab);
    setStylistSearch("");
    setStylistModalOpen(true);
  };

  const handleAssignStylist = async (stylist) => {
    if (!activeSalonForStylists) return;
    try {
      setActionLoadingId(stylist.id);
      await assignStylistToSalon(stylist.id, activeSalonForStylists.id);
      message.success(`Đã thêm thợ "${stylist.fullName || stylist.username}" vào ${activeSalonForStylists.salonName}!`);
      if (onReloadSalons) await onReloadSalons();
    } catch (err) {
      console.error(err);
      message.error("Thêm thợ vào salon thất bại: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveStylist = async (stylist, salon = activeSalonForStylists) => {
    if (!salon) return;
    try {
      setActionLoadingId(stylist.id);
      await removeStylistFromSalon(stylist.id);
      message.success(`Đã xóa thợ "${stylist.fullName || stylist.username}" khỏi ${salon.salonName}!`);
      if (onReloadSalons) await onReloadSalons();
    } catch (err) {
      console.error(err);
      message.error("Xóa thợ khỏi salon thất bại: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenModal = (salon = null) => {
    setEditingSalon(salon);
    if (salon) {
      let openT = null;
      let closeT = null;
      if (Array.isArray(salon.openTime)) {
        openT = dayjs().hour(salon.openTime[0]).minute(salon.openTime[1]);
      } else if (salon.openTime) {
        openT = dayjs(salon.openTime, "HH:mm");
      }
      if (Array.isArray(salon.closeTime)) {
        closeT = dayjs().hour(salon.closeTime[0]).minute(salon.closeTime[1]);
      } else if (salon.closeTime) {
        closeT = dayjs(salon.closeTime, "HH:mm");
      }

      form.setFieldsValue({
        salonName: salon.salonName,
        address: salon.address,
        city: salon.city || "Hà Nội",
        phoneNumber: salon.phoneNumber,
        email: salon.email,
        openTime: openT,
        closeTime: closeT,
        enabled: salon.enabled !== false,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        city: "Hà Nội",
        openTime: dayjs().hour(8).minute(30),
        closeTime: dayjs().hour(21).minute(30),
        enabled: true,
      });
    }
    setModalOpen(true);
  };

  const handleSaveSalon = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        ...(editingSalon ? { id: editingSalon.id } : {}),
        salonName: values.salonName,
        address: values.address,
        city: values.city,
        phoneNumber: values.phoneNumber,
        email: values.email,
        openTime: values.openTime ? values.openTime.format("HH:mm:ss") : "08:30:00",
        closeTime: values.closeTime ? values.closeTime.format("HH:mm:ss") : "21:30:00",
        enabled: values.enabled,
      };

      if (editingSalon) {
        await updateSalon(payload);
        message.success("Đã cập nhật thông tin salon thành công!");
      } else {
        await createSalon(payload);
        message.success("Đã thêm mới salon thành công!");
      }

      setModalOpen(false);
      if (onReloadSalons) onReloadSalons();
    } catch (err) {
      console.error(err);
      message.error("Lưu thông tin salon thất bại: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (salon) => {
    try {
      const newEnabled = !salon.enabled;
      let openTStr = "08:30:00";
      let closeTStr = "21:30:00";
      if (Array.isArray(salon.openTime)) {
        openTStr = `${String(salon.openTime[0]).padStart(2, "0")}:${String(salon.openTime[1]).padStart(2, "0")}:00`;
      } else if (salon.openTime) {
        openTStr = salon.openTime;
      }
      if (Array.isArray(salon.closeTime)) {
        closeTStr = `${String(salon.closeTime[0]).padStart(2, "0")}:${String(salon.closeTime[1]).padStart(2, "0")}:00`;
      } else if (salon.closeTime) {
        closeTStr = salon.closeTime;
      }

      const payload = {
        ...salon,
        openTime: openTStr,
        closeTime: closeTStr,
        enabled: newEnabled,
      };

      await updateSalon(payload);
      message.success(
        newEnabled
          ? `Đã kích hoạt hoạt động cơ sở ${salon.salonName}!`
          : `Đã tạm ngưng hoạt động cơ sở ${salon.salonName}!`
      );
      if (onReloadSalons) onReloadSalons();
    } catch (err) {
      message.error("Đổi trạng thái salon thất bại: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteSalon = async (salonId) => {
    try {
      await deleteSalon(salonId);
      message.success("Đã xóa salon thành công!");
      if (onReloadSalons) onReloadSalons();
    } catch (err) {
      message.error("Xóa salon thất bại!");
    }
  };

  // Aggregated overview stats
  const totalSalons = salons.length;
  const activeSalons = salons.filter((s) => s.enabled).length;
  const suspendedSalons = totalSalons - activeSalons;
  const totalBookings = bookings.length;
  const totalCompletedBookings = bookings.filter((b) => b.status === "COMPLETED");
  const chainRevenue = totalCompletedBookings.reduce(
    (s, b) => s + (Number(b.totalAmount) || 0),
    0
  );

  // Detail Modal for Salons KPI Cards
  const [kpiSalonModalTitle, setKpiSalonModalTitle] = useState("");
  const [kpiSalonModalOpen, setKpiSalonModalOpen] = useState(false);
  const [kpiSalonModalList, setKpiSalonModalList] = useState([]);

  const handleOpenSalonKpi = (title, list) => {
    setKpiSalonModalTitle(title);
    setKpiSalonModalList(list);
    setKpiSalonModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER WITH ACTIONS & SUMMARY ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-0 flex items-center gap-2">
            <ShopOutlined className="text-amber-500" />
            Quản lý Chuỗi Salon BachBarber
          </h2>
          <p className="text-xs text-gray-400 mb-0 mt-0.5">
            Quản trị {totalSalons} cơ sở, trạng thái hoạt động và cấu hình nhân sự
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal(null)}
            className="rounded-xl bg-blue-600 font-semibold text-xs"
          >
            Thêm mới Salon
          </Button>
        </div>
      </div>

      {/* ── OVERVIEW STATS CARDS WITH DRILL-DOWN ── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-blue-50/60 group"
            onClick={() => handleOpenSalonKpi("Tất cả chi nhánh Salon", salons || [])}
          >
            <Statistic
              title={<span className="text-xs font-bold uppercase text-blue-700">Quy mô chi nhánh</span>}
              value={totalSalons}
              suffix={<span className="text-xs text-gray-400 font-normal">cơ sở</span>}
              prefix={<ShopOutlined className="text-blue-500 mr-1" />}
              styles={{ content: { fontWeight: 900, color: "#1e3a8a" } }}
            />
            <div className="mt-2 text-xs text-blue-600 font-medium flex items-center justify-between group-hover:underline">
              <span>Mở cửa: {activeSalons} | Tạm ngưng: {suspendedSalons}</span>
              <EyeOutlined />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-emerald-50/60 group"
            onClick={() => handleOpenSalonKpi("Doanh thu phân bổ theo từng Salon", salons || [])}
          >
            <Statistic
              title={<span className="text-xs font-bold uppercase text-emerald-700">Tổng doanh thu chuỗi</span>}
              value={chainRevenue}
              formatter={(v) => formatCurrency(v)}
              prefix={<DollarOutlined className="text-emerald-500 mr-1" />}
              styles={{ content: { fontWeight: 900, color: "#065f46" } }}
            />
            <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center justify-between group-hover:underline">
              <span>Đã hoàn tất {totalCompletedBookings.length} lịch hẹn</span>
              <EyeOutlined />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-purple-50/60 group"
            onClick={() => handleOpenSalonKpi("Phân bổ Stylist tại các chi nhánh", salons || [])}
          >
            <Statistic
              title={<span className="text-xs font-bold uppercase text-purple-700">Tổng Stylist chuỗi</span>}
              value={stylists.length}
              suffix={<span className="text-xs text-gray-400 font-normal">thợ</span>}
              prefix={<TeamOutlined className="text-purple-500 mr-1" />}
              styles={{ content: { fontWeight: 900, color: "#581c87" } }}
            />
            <div className="mt-2 text-xs text-purple-600 font-medium flex items-center justify-between group-hover:underline">
              <span>TB ~{totalSalons > 0 ? (stylists.length / totalSalons).toFixed(1) : 0} thợ/cơ sở</span>
              <EyeOutlined />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-amber-50/60 group"
            onClick={() => handleOpenSalonKpi("Thống kê lịch hẹn theo chi nhánh", salons || [])}
          >
            <Statistic
              title={<span className="text-xs font-bold uppercase text-amber-700">Tổng lượt đặt chỗ</span>}
              value={totalBookings}
              suffix={<span className="text-xs text-gray-400 font-normal">lượt</span>}
              prefix={<CalendarOutlined className="text-amber-500 mr-1" />}
              styles={{ content: { fontWeight: 900, color: "#78350f" } }}
            />
            <div className="mt-2 text-xs text-amber-700 font-medium flex items-center justify-between group-hover:underline">
              <span>Tỷ lệ hoàn thành: {totalBookings > 0 ? Math.round((totalCompletedBookings.length / totalBookings) * 100) : 0}%</span>
              <EyeOutlined />
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── SALONS GRID WITH CRUD AND DETAIL LINK ── */}
      <Row gutter={[16, 16]}>
        {salons.map((salon) => {
          const salonStylists = stylists.filter((s) => s.salonId === salon.id);
          const salonBookings = bookings.filter((b) => b.salonId === salon.id);
          const salonCompleted = salonBookings.filter((b) => b.status === "COMPLETED");
          const salonRev = salonCompleted.reduce((s, b) => s + (Number(b.totalAmount) || 0), 0);
          const compRate = salonBookings.length > 0 ? Math.round((salonCompleted.length / salonBookings.length) * 100) : 0;

          return (
            <Col key={salon.id} xs={24} md={12} lg={8}>
              <Card
                className={`rounded-2xl border transition-all hover:shadow-md ${
                  salon.enabled ? "border-gray-200 bg-white" : "border-red-200 bg-red-50/20 opacity-90"
                }`}
              >
                {/* Salon header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${
                      salon.enabled ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-gray-100 text-gray-400"
                    }`}>
                      <ShopOutlined />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-900 mb-0.5 flex items-center gap-1.5">
                        {salon.salonName}
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <Tag color={salon.enabled ? "success" : "error"} className="text-[10px] m-0 py-0 px-1.5">
                          {salon.enabled ? "Đang mở cửa" : "Tạm ngưng"}
                        </Tag>
                        <span className="text-[11px] text-gray-400">{salon.city}</span>
                      </div>
                    </div>
                  </div>

                  <Switch
                    checked={salon.enabled}
                    onChange={() => handleToggleStatus(salon)}
                    checkedChildren="Mở"
                    unCheckedChildren="Tắt"
                    size="small"
                  />
                </div>

                {/* Info info */}
                <div className="space-y-1.5 text-xs text-gray-600 mb-3 bg-slate-50/70 p-3 rounded-xl border border-gray-100">
                  <p className="mb-0 flex items-start gap-1.5 truncate">
                    <EnvironmentOutlined className="text-amber-500 mt-0.5 shrink-0" />
                    <span className="truncate">{salon.address}</span>
                  </p>
                  <p className="mb-0 flex items-center gap-1.5">
                    <PhoneOutlined className="text-amber-500 shrink-0" />
                    <span>{salon.phoneNumber || "1900 1234"}</span>
                  </p>
                  <p className="mb-0 flex items-center gap-1.5">
                    <ClockCircleOutlined className="text-amber-500 shrink-0" />
                    <span>
                      {Array.isArray(salon.openTime)
                        ? `${String(salon.openTime[0]).padStart(2, "0")}:${String(salon.openTime[1]).padStart(2, "0")}`
                        : salon.openTime || "08:30"}{" "}
                      –{" "}
                      {Array.isArray(salon.closeTime)
                        ? `${String(salon.closeTime[0]).padStart(2, "0")}:${String(salon.closeTime[1]).padStart(2, "0")}`
                        : salon.closeTime || "21:30"}
                    </span>
                  </p>
                </div>

                {/* Performance stats */}
                <div className="grid grid-cols-3 gap-2 py-2 px-1 text-center border-t border-b border-gray-100 mb-3 text-xs">
                  <div
                    className="cursor-pointer hover:bg-purple-50 rounded-lg py-0.5 px-0.5 transition-colors group"
                    onClick={() => handleOpenStylistModal(salon, "current")}
                    title="Bấm để xem & quản lý danh sách thợ chi nhánh"
                  >
                    <div className="font-bold text-gray-900 group-hover:text-purple-700">{salonStylists.length} thợ</div>
                    <div className="text-[10px] text-gray-400 group-hover:text-purple-600">Nhân sự (Xem)</div>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{salonBookings.length} lịch</div>
                    <div className="text-[10px] text-gray-400">Đã đặt</div>
                  </div>
                  <div>
                    <div className="font-bold text-blue-700">{formatCurrency(salonRev)}</div>
                    <div className="text-[10px] text-gray-400">Doanh thu</div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center justify-between gap-1.5 pt-1">
                  <Button
                    size="small"
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/admin/salons/${salon.id}`)}
                    className="text-xs bg-indigo-600 rounded-lg flex-1"
                  >
                    Thống kê chi tiết
                  </Button>

                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleOpenModal(salon)}
                    className="text-xs rounded-lg"
                  >
                    Sửa
                  </Button>

                  <Button
                    size="small"
                    icon={<UserAddOutlined />}
                    onClick={() => handleOpenStylistModal(salon, "available")}
                    className="text-xs rounded-lg text-purple-700 border-purple-200 hover:bg-purple-50"
                    title="Thêm stylist vào chi nhánh"
                  >
                    +Thợ
                  </Button>

                  <Popconfirm
                    title="Xóa salon này?"
                    description="Hành động này không thể hoàn tác!"
                    onConfirm={() => handleDeleteSalon(salon.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                  >
                    <Button size="small" danger className="text-xs rounded-lg">
                      Xóa
                    </Button>
                  </Popconfirm>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* ── CREATE / EDIT SALON MODAL ── */}
      <Modal
        title={
          <div className="font-bold text-base text-gray-800 flex items-center gap-2">
            <ShopOutlined className="text-blue-600" />
            {editingSalon ? "Chỉnh sửa thông tin Salon" : "Thêm mới Chi nhánh Salon"}
          </div>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSaveSalon}
        confirmLoading={submitting}
        okText={editingSalon ? "Lưu thay đổi" : "Tạo Salon"}
        cancelText="Hủy bỏ"
        destroyOnHidden
        centered
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="salonName"
            label="Tên chi nhánh salon"
            rules={[{ required: true, message: "Vui lòng nhập tên salon!" }]}
          >
            <Input placeholder="VD: BachBarber Cầu Giấy, BachBarber Quận 1..." />
          </Form.Item>

          <Row gutter={12}>
            <Col span={14}>
              <Form.Item
                name="address"
                label="Địa chỉ chi tiết"
                rules={[{ required: true, message: "Vui lòng nhập địa chỉ!" }]}
              >
                <Input placeholder="Số nhà, tên đường, phường..." />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                name="city"
                label="Tỉnh / Thành phố"
                rules={[{ required: true, message: "Vui lòng chọn thành phố!" }]}
              >
                <Select>
                  <Option value="Hà Nội">Hà Nội</Option>
                  <Option value="Hồ Chí Minh">TP. Hồ Chí Minh</Option>
                  <Option value="Đà Nẵng">Đà Nẵng</Option>
                  <Option value="Hải Phòng">Hải Phòng</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="phoneNumber"
                label="Số điện thoại / Hotline"
                rules={[{ required: true, message: "Vui lòng nhập hotline!" }]}
              >
                <Input placeholder="1900 1234 hoặc 0988..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="Email chi nhánh">
                <Input placeholder="salon.caugiay@bachbarber.vn" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="openTime"
                label="Giờ mở cửa"
                rules={[{ required: true, message: "Vui lòng chọn giờ mở cửa!" }]}
              >
                <TimePicker format="HH:mm" className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="closeTime"
                label="Giờ đóng cửa"
                rules={[{ required: true, message: "Vui lòng chọn giờ đóng cửa!" }]}
              >
                <TimePicker format="HH:mm" className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="enabled"
            label="Trạng thái hoạt động"
            valuePropName="checked"
          >
            <Switch checkedChildren="Mở cửa đón khách" unCheckedChildren="Tạm ngưng nhận khách" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── MODAL: KPI SALONS DRILL-DOWN ────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-2 font-bold text-gray-800">
            <ShopOutlined className="text-blue-600" />
            <span>{kpiSalonModalTitle} ({kpiSalonModalList.length})</span>
          </div>
        }
        open={kpiSalonModalOpen}
        onCancel={() => setKpiSalonModalOpen(false)}
        footer={null}
        width={850}
        centered
        destroyOnHidden
      >
        <div className="mt-4">
          <Table
            dataSource={kpiSalonModalList}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 5 }}
            columns={[
              {
                title: "Chi nhánh",
                dataIndex: "salonName",
                render: (v, r) => (
                  <div>
                    <div className="font-bold text-xs text-gray-900">{v}</div>
                    <div className="text-[10px] text-gray-400">📍 {r.address}, {r.city}</div>
                  </div>
                ),
              },
              {
                title: "Hotline",
                dataIndex: "phoneNumber",
                render: (v) => <span className="text-xs">{v || "—"}</span>,
              },
              {
                title: "Đội ngũ Stylist",
                key: "stylists",
                render: (_, r) => {
                  const sCount = stylists.filter((s) => s.salonId === r.id).length;
                  return <Tag color="purple">{sCount} thợ</Tag>;
                },
              },
              {
                title: "Doanh thu cơ sở",
                key: "revenue",
                render: (_, r) => {
                  const sBookings = bookings.filter((b) => b.salonId === r.id && b.status === "COMPLETED");
                  const rev = sBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
                  return <span className="font-bold text-xs text-emerald-700">{formatCurrency(rev)}</span>;
                },
              },
              {
                title: "Trạng thái",
                dataIndex: "enabled",
                render: (v) => <Tag color={v ? "success" : "error"}>{v ? "Mở cửa" : "Tạm ngưng"}</Tag>,
              },
              {
                title: "Thao tác",
                key: "action",
                render: (_, r) => (
                  <Button
                    size="small"
                    type="link"
                    icon={<RightOutlined />}
                    onClick={() => {
                      setKpiSalonModalOpen(false);
                      navigate(`/admin/salon/${r.id}`);
                    }}
                    className="text-xs font-semibold p-0"
                  >
                    Chi tiết
                  </Button>
                ),
              },
            ]}
          />
        </div>
      </Modal>

      {/* ── MANAGE / ADD / REMOVE STYLISTS MODAL ── */}
      <Modal
        title={
          <div className="font-bold text-base text-gray-800 flex items-center gap-2">
            <UserAddOutlined className="text-purple-600" />
            <span>Quản lý Stylist: <span className="text-blue-600">{activeSalonForStylists?.salonName}</span></span>
          </div>
        }
        open={stylistModalOpen}
        onCancel={() => setStylistModalOpen(false)}
        footer={null}
        width={750}
        centered
        destroyOnHidden
      >
        <div className="py-2">
          <Tabs
            activeKey={stylistModalTab}
            onChange={setStylistModalTab}
            items={[
              {
                key: "available",
                label: `Thêm thợ mới (${stylists.filter((s) => s.salonId !== activeSalonForStylists?.id).length})`,
                children: (
                  <div className="space-y-4">
                    <Input
                      placeholder="Tìm thợ theo tên, số điện thoại, biệt danh..."
                      prefix={<SearchOutlined className="text-gray-400" />}
                      value={stylistSearch}
                      onChange={(e) => setStylistSearch(e.target.value)}
                      allowClear
                      className="rounded-xl"
                    />

                    <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
                      {(() => {
                        const candidates = stylists
                          .filter((s) => s.salonId !== activeSalonForStylists?.id)
                          .filter((s) => {
                            if (!stylistSearch) return true;
                            const q = stylistSearch.toLowerCase();
                            return (
                              (s.fullName && s.fullName.toLowerCase().includes(q)) ||
                              (s.username && s.username.toLowerCase().includes(q)) ||
                              (s.phoneNumber && s.phoneNumber.includes(q)) ||
                              (s.nickname && s.nickname.toLowerCase().includes(q))
                            );
                          });

                        if (candidates.length === 0) {
                          return (
                            <div className="py-10 text-center">
                              <Empty description="Không có stylist nào phù hợp để thêm vào chi nhánh này" />
                            </div>
                          );
                        }

                        return candidates.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 hover:bg-purple-50/40 border border-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar
                                size={44}
                                src={s.avatarUrl}
                                icon={!s.avatarUrl ? <UserOutlined /> : null}
                                className="border border-purple-200"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-sm text-gray-900 mb-0">
                                    {s.fullName || s.username}
                                  </h4>
                                  <Tag color="purple" className="text-[10px] m-0 py-0 px-1.5">
                                    {s.levelRank || "SENIOR"}
                                  </Tag>
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                  <span>📞 {s.phoneNumber || "—"}</span>
                                  <span>•</span>
                                  {s.salonName ? (
                                    <Tag color="orange" className="text-[10px] m-0">
                                      Đang ở: {s.salonName}
                                    </Tag>
                                  ) : (
                                    <Tag color="default" className="text-[10px] m-0">
                                      Chưa ở salon nào
                                    </Tag>
                                  )}
                                </div>
                              </div>
                            </div>

                            <Button
                              type="primary"
                              size="small"
                              icon={<PlusOutlined />}
                              loading={actionLoadingId === s.id}
                              onClick={() => handleAssignStylist(s)}
                              className="rounded-lg text-xs bg-purple-600 hover:bg-purple-700"
                            >
                              {s.salonName ? "Chuyển sang salon này" : "Thêm vào salon"}
                            </Button>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                ),
              },
              {
                key: "current",
                label: `Thợ hiện tại của salon (${stylists.filter((s) => s.salonId === activeSalonForStylists?.id).length})`,
                children: (
                  <div className="space-y-4">
                    <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
                      {(() => {
                        const currentStylists = stylists.filter(
                          (s) => s.salonId === activeSalonForStylists?.id
                        );

                        if (currentStylists.length === 0) {
                          return (
                            <div className="py-10 text-center">
                              <Empty description="Chi nhánh này hiện chưa có stylist nào. Hãy chuyển sang tab 'Thêm thợ mới' để thêm!" />
                            </div>
                          );
                        }

                        return currentStylists.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 hover:bg-gray-100/70 border border-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar
                                size={44}
                                src={s.avatarUrl}
                                icon={!s.avatarUrl ? <UserOutlined /> : null}
                                className="border border-blue-200"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-sm text-gray-900 mb-0">
                                    {s.fullName || s.username}
                                  </h4>
                                  <Tag color="blue" className="text-[10px] m-0 py-0 px-1.5">
                                    {s.levelRank || "SENIOR"}
                                  </Tag>
                                  <Tag color={s.status === "ACTIVE" ? "success" : "default"} className="text-[10px] m-0">
                                    {s.status === "ACTIVE" ? "Đang trực" : "Nghỉ"}
                                  </Tag>
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                  <span>📞 {s.phoneNumber || "—"}</span>
                                  <span>•</span>
                                  <span>⭐ {s.rating || 5.0}</span>
                                </div>
                              </div>
                            </div>

                            <Popconfirm
                              title="Xóa thợ khỏi salon?"
                              description={`Bạn có chắc chắn muốn xóa thợ "${s.fullName || s.username}" khỏi chi nhánh này?`}
                              onConfirm={() => handleRemoveStylist(s)}
                              okText="Xóa khỏi salon"
                              cancelText="Hủy"
                              okButtonProps={{ danger: true }}
                            >
                              <Button
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                loading={actionLoadingId === s.id}
                                className="rounded-lg text-xs"
                              >
                                Xóa khỏi salon
                              </Button>
                            </Popconfirm>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}
