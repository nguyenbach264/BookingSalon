import React, { useState, useMemo } from "react";
import {
  Row,
  Col,
  Card,
  Input,
  Select,
  Table,
  Button,
  Tag,
  Avatar,
  Badge,
  Modal,
  Form,
  Statistic,
  message,
  Popconfirm,
  Tabs,
  Descriptions,
  List,
  Switch,
  Tooltip,
  Spin,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  EditOutlined,
  LockOutlined,
  UnlockOutlined,
  KeyOutlined,
  CrownOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  DollarOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
  GiftOutlined,
  EyeOutlined,
  HomeOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import { updateUser, resetUserPassword, deleteUser, getUserDetailSummary } from "../../../service/api/adminApi";

const { Option } = Select;

const formatCurrency = (val) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val ?? 0);

const TIER_COLORS = {
  VIP: "gold",
  GOLD: "orange",
  SILVER: "blue",
  STANDARD: "cyan",
};

const formatGender = (gender) => {
  switch (gender?.toUpperCase()) {
    case "MALE":
    case "NAM":
      return "Nam";
    case "FEMALE":
    case "NỮ":
      return "Nữ";
    default:
      return "Khác";
  }
};

const formatDateTime = (dt) => {
  if (!dt) return "Mới tham gia";
  try {
    const d = Array.isArray(dt) ? new Date(...dt) : new Date(dt);
    if (isNaN(d.getTime())) return "Mới tham gia";
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "Mới tham gia";
  }
};

const formatFullDateTime = (dt) => {
  if (!dt) return "—";
  try {
    const d = Array.isArray(dt) ? new Date(...dt) : new Date(dt);
    if (isNaN(d.getTime())) return String(dt);
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return String(dt);
  }
};

export default function AdminUsersView({
  userSearch,
  setUserSearch,
  userTierFilter,
  setUserTierFilter,
  filteredUsers = [],
  users = [],
  bookings = [],
  orders = [],
  onReloadUsers,
}) {
  const [pagination, setPagination] = useState({ current: 1, pageSize: 8 });

  // Detail Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailSummary, setDetailSummary] = useState(null);

  // Open Detail Modal & Fetch complete DB summary
  const handleOpenDetail = async (user) => {
    setSelectedUser(user);
    setDetailSummary(null);
    setDetailModalOpen(true);
    setLoadingDetail(true);
    try {
      const targetId = user.id || user.keycloakId;
      const res = await getUserDetailSummary(targetId);
      if (res) {
        if (res.user) {
          setSelectedUser((prev) => ({
            ...prev,
            ...res.user,
          }));
        }
        setDetailSummary(res);
      }
    } catch (err) {
      console.error("Failed to load user detail summary:", err);
      message.error("Không thể tải chi tiết hồ sơ từ DB: " + (err.response?.data?.message || err.message));
    } finally {
      setLoadingDetail(false);
    }
  };

  // Edit User Modal
  const [editingUser, setEditingUser] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm] = Form.useForm();

  // Reset Password Modal
  const [resetPwdUser, setResetPwdUser] = useState(null);
  const [resetPwdModalOpen, setResetPwdModalOpen] = useState(false);
  const [resettingPwd, setResettingPwd] = useState(false);
  const [pwdForm] = Form.useForm();

  // Open Edit Modal
  const handleOpenEdit = (user) => {
    setEditingUser(user);
    editForm.setFieldsValue({
      fullName: user.fullName || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      gender: user.gender || "Nam",
      membershipTier: user.membershipTier || "STANDARD",
      city: user.city || "",
      district: user.district || "",
      ward: user.ward || "",
      address: user.address || "",
      emailVerified: user.emailVerified === true,
      enabled: user.enabled !== false,
    });
    setEditModalOpen(true);
  };

  // Submit Edit User
  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields();
      setSavingEdit(true);
      await updateUser(editingUser.id, values);
      message.success("Cập nhật thông tin khách hàng thành công!");
      setEditModalOpen(false);
      if (selectedUser && selectedUser.id === editingUser.id) {
        setSelectedUser((prev) => ({ ...prev, ...values }));
      }
      if (onReloadUsers) onReloadUsers();
    } catch (err) {
      message.error("Cập nhật thất bại: " + (err.response?.data?.message || err.message));
    } finally {
      setSavingEdit(false);
    }
  };

  // Lock / Unlock User Account
  const handleToggleUserStatus = async (user) => {
    try {
      const newEnabled = user.enabled === false;
      await updateUser(user.id, {
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        enabled: newEnabled,
      });
      message.success(
        newEnabled
          ? `Đã mở khóa tài khoản ${user.username}!`
          : `Đã khóa tài khoản ${user.username}!`
      );
      if (selectedUser && selectedUser.id === user.id) {
        setSelectedUser((prev) => ({ ...prev, enabled: newEnabled }));
      }
      if (onReloadUsers) onReloadUsers();
    } catch (err) {
      message.error("Thao tác thất bại: " + (err.response?.data?.message || err.message));
    }
  };

  // Open Reset Password Modal
  const handleOpenResetPwd = (user) => {
    setResetPwdUser(user);
    pwdForm.resetFields();
    setResetPwdModalOpen(true);
  };

  // Submit Reset Password
  const handleSaveResetPwd = async () => {
    try {
      const values = await pwdForm.validateFields();
      setResettingPwd(true);
      await resetUserPassword(resetPwdUser.id, values.newPassword);
      message.success(`Đã đổi mật khẩu cho tài khoản ${resetPwdUser.username}!`);
      setResetPwdModalOpen(false);
    } catch (err) {
      message.error("Đổi mật khẩu thất bại: " + (err.response?.data?.message || err.message));
    } finally {
      setResettingPwd(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId);
      message.success("Đã xóa tài khoản người dùng!");
      if (selectedUser && selectedUser.id === userId) {
        setDetailModalOpen(false);
      }
      if (onReloadUsers) onReloadUsers();
    } catch (err) {
      message.error("Xóa người dùng thất bại!");
    }
  };

  // User details: bookings and orders for selectedUser (Accurate DB join & matching)
  const userBookings = useMemo(() => {
    if (!selectedUser) return [];
    const uid = selectedUser.id ? String(selectedUser.id).toLowerCase() : null;
    const kid = selectedUser.keycloakId ? String(selectedUser.keycloakId).toLowerCase() : null;
    const phone = selectedUser.phoneNumber ? selectedUser.phoneNumber.trim() : null;
    const email = selectedUser.email ? selectedUser.email.trim().toLowerCase() : null;
    const name = selectedUser.fullName ? selectedUser.fullName.trim().toLowerCase() : null;

    return bookings.filter((b) => {
      const bCustomerId = b.customerId ? String(b.customerId).toLowerCase() : null;
      const bUserId = b.userId ? String(b.userId).toLowerCase() : null;
      const bPhone = (b.customerPhone || b.phone || "").trim();
      const bEmail = (b.customerEmail || b.email || "").trim().toLowerCase();
      const bName = (b.customerName || "").trim().toLowerCase();

      if (uid && (bCustomerId === uid || bUserId === uid)) return true;
      if (kid && (bCustomerId === kid || bUserId === kid)) return true;
      if (phone && bPhone && (bPhone === phone || bPhone.endsWith(phone.slice(-9)) || phone.endsWith(bPhone.slice(-9)))) return true;
      if (email && bEmail && bEmail === email) return true;
      if (name && bName && bName === name) return true;
      return false;
    });
  }, [selectedUser, bookings]);

  const userOrders = useMemo(() => {
    if (!selectedUser) return [];
    const uid = selectedUser.id ? String(selectedUser.id).toLowerCase() : null;
    const kid = selectedUser.keycloakId ? String(selectedUser.keycloakId).toLowerCase() : null;
    const phone = selectedUser.phoneNumber ? selectedUser.phoneNumber.trim() : null;
    const email = selectedUser.email ? selectedUser.email.trim().toLowerCase() : null;
    const name = selectedUser.fullName ? selectedUser.fullName.trim().toLowerCase() : null;

    return orders.filter((o) => {
      const oUserId = o.userId ? String(o.userId).toLowerCase() : null;
      const oPhone = (o.customerPhone || o.shippingPhone || o.receiverPhone || o.phone || "").trim();
      const oEmail = (o.customerEmail || o.shippingEmail || o.email || "").trim().toLowerCase();
      const oName = (o.customerName || o.receiverName || "").trim().toLowerCase();

      if (uid && oUserId === uid) return true;
      if (kid && oUserId === kid) return true;
      if (phone && oPhone && (oPhone === phone || oPhone.endsWith(phone.slice(-9)) || phone.endsWith(oPhone.slice(-9)))) return true;
      if (email && oEmail && oEmail === email) return true;
      if (name && oName && oName === name) return true;
      return false;
    });
  }, [selectedUser, orders]);

  const totalBookingSpent = useMemo(() => {
    return userBookings.reduce((sum, b) => {
      if (b.status === "COMPLETED" || b.status === "CONFIRMED") {
        return sum + (Number(b.totalAmount) || 0);
      }
      return sum;
    }, 0);
  }, [userBookings]);

  const totalOrderSpent = useMemo(() => {
    return userOrders.reduce((sum, o) => {
      if (o.status !== "CANCELLED" && o.orderStatus !== "CANCELLED") {
        return sum + (Number(o.finalAmount ?? o.totalAmount) || 0);
      }
      return sum;
    }, 0);
  }, [userOrders]);

  const displayBookings = detailSummary?.bookings || userBookings || [];
  const displayOrders = detailSummary?.orders || userOrders || [];
  const displayTotalBookingSpent = detailSummary?.totalBookingSpent ?? totalBookingSpent;
  const displayTotalOrderSpent = detailSummary?.totalOrderSpent ?? totalOrderSpent;

  // Aggregate user statistics
  const totalUsers = users.length;
  const vipCount = users.filter((u) => u.membershipTier === "VIP" || u.membershipTier === "GOLD").length;
  const activeCount = users.filter((u) => u.enabled !== false).length;
  const lockedCount = totalUsers - activeCount;

  // Table Columns
  const columns = [
    {
      title: "Khách hàng",
      dataIndex: "fullName",
      key: "fullName",
      render: (v, r) => (
        <div className="flex items-center gap-3">
          <Avatar size={38} src={r.avatarUrl} icon={<UserOutlined />} className="border border-gray-200" />
          <div>
            <div className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
              {v || r.username || "Khách hàng"}
              {r.emailVerified ? (
                <CheckCircleOutlined className="text-emerald-500 text-[11px]" title="Đã xác thực email" />
              ) : (
                <Tooltip title="Chưa xác thực email">
                  <ExclamationCircleOutlined className="text-amber-500 text-[11px]" />
                </Tooltip>
              )}
            </div>
            <div className="text-gray-400 text-[11px]">@{r.username}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Liên hệ",
      key: "contact",
      render: (_, r) => (
        <div className="text-xs">
          <div className="text-gray-700 flex items-center gap-1">
            <PhoneOutlined className="text-gray-400" /> {r.phoneNumber || "Chưa có SĐT"}
          </div>
          <div className="text-gray-400 text-[11px] truncate max-w-[180px] flex items-center gap-1">
            <MailOutlined className="text-gray-400" /> {r.email || "—"}
          </div>
        </div>
      ),
    },
    {
      title: "Giới tính & Khu vực",
      key: "region",
      render: (_, r) => (
        <div className="text-xs">
          <div className="text-gray-700 font-medium">{formatGender(r.gender)}</div>
          <div className="text-gray-400 text-[11px] truncate max-w-[170px]" title={[r.address, r.ward, r.district, r.city].filter(Boolean).join(", ")}>
            {[r.ward, r.district, r.city].filter(Boolean).join(", ") || r.address || "Chưa có"}
          </div>
        </div>
      ),
    },
    {
      title: "Hạng thẻ",
      dataIndex: "membershipTier",
      key: "membershipTier",
      render: (v) => (
        <Tag color={TIER_COLORS[v] ?? "cyan"} className="font-bold text-xs">
          {v || "STANDARD"}
        </Tag>
      ),
    },
    {
      title: "Ngày tham gia",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v) => (
        <span className="text-xs text-gray-500">{formatDateTime(v)}</span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "enabled",
      key: "enabled",
      render: (v) => (
        <Tag color={v !== false ? "success" : "error"} className="text-xs">
          {v !== false ? "HOẠT ĐỘNG" : "BỊ KHÓA"}
        </Tag>
      ),
    },
    {
      title: "Thao tác quản trị",
      key: "action",
      render: (_, r) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            size="small"
            onClick={() => handleOpenDetail(r)}
            className="text-xs rounded-lg"
          >
            Hồ sơ & Lịch sử
          </Button>

          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenEdit(r)}
            className="text-xs rounded-lg"
          >
            Sửa
          </Button>

          <Button
            size="small"
            icon={<KeyOutlined />}
            onClick={() => handleOpenResetPwd(r)}
            className="text-xs rounded-lg"
            title="Đổi mật khẩu"
          >
            Mật khẩu
          </Button>

          <Button
            size="small"
            type={r.enabled === false ? "primary" : "default"}
            danger={r.enabled !== false}
            icon={r.enabled === false ? <UnlockOutlined /> : <LockOutlined />}
            onClick={() => handleToggleUserStatus(r)}
            className="text-xs rounded-lg"
          >
            {r.enabled === false ? "Mở khóa" : "Khóa"}
          </Button>

          <Popconfirm
            title="Xóa tài khoản này?"
            description="Tài khoản và liên kết dữ liệu sẽ bị xóa hoàn toàn."
            onConfirm={() => handleDeleteUser(r.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger className="text-xs rounded-lg">
              Xóa
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  // Detail Modal for Users KPI Cards
  const [kpiUserModalTitle, setKpiUserModalTitle] = useState("");
  const [kpiUserModalOpen, setKpiUserModalOpen] = useState(false);
  const [kpiUserModalList, setKpiUserModalList] = useState([]);

  const handleOpenUserKpi = (title, list) => {
    setKpiUserModalTitle(title);
    setKpiUserModalList(list);
    setKpiUserModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* ── TOP STATS CARDS WITH DRILL-DOWN ── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-blue-50/60 group"
            onClick={() => handleOpenUserKpi("Tất cả khách hàng thành viên", users)}
          >
            <Statistic
              title={<span className="text-xs font-bold uppercase text-blue-700">Tổng khách hàng</span>}
              value={totalUsers}
              suffix={<span className="text-xs text-gray-400 font-normal">tài khoản</span>}
              prefix={<UserOutlined className="text-blue-500 mr-1" />}
              styles={{ content: { fontWeight: 900, color: "#1e3a8a" } }}
            />
            <div className="mt-2 text-xs text-blue-600 font-medium flex items-center justify-between group-hover:underline">
              <span>Đang hoạt động: {activeCount}</span>
              <EyeOutlined />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-amber-50/60 group"
            onClick={() => handleOpenUserKpi("Danh sách Hội viên VIP & Vàng", (users || []).filter((u) => u.membershipTier === "VIP" || u.membershipTier === "GOLD"))}
          >
            <Statistic
              title={<span className="text-xs font-bold uppercase text-amber-700">Hội viên VIP & Vàng</span>}
              value={vipCount}
              suffix={<span className="text-xs text-gray-400 font-normal">thành viên</span>}
              prefix={<CrownOutlined className="text-amber-500 mr-1" />}
              styles={{ content: { fontWeight: 900, color: "#78350f" } }}
            />
            <div className="mt-2 text-xs text-amber-700 font-medium flex items-center justify-between group-hover:underline">
              <span>Xem danh sách VIP/Vàng</span>
              <EyeOutlined />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-emerald-50/60 group"
            onClick={() => handleOpenUserKpi("Danh sách Hội viên Hạng Chuẩn & Bạc", (users || []).filter((u) => u.membershipTier !== "VIP" && u.membershipTier !== "GOLD"))}
          >
            <Statistic
              title={<span className="text-xs font-bold uppercase text-emerald-700">Tài khoản chuẩn</span>}
              value={totalUsers - vipCount}
              suffix={<span className="text-xs text-gray-400 font-normal">người</span>}
              prefix={<SafetyCertificateOutlined className="text-emerald-500 mr-1" />}
              styles={{ content: { fontWeight: 900, color: "#065f46" } }}
            />
            <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center justify-between group-hover:underline">
              <span>Hạng Silver & Standard</span>
              <EyeOutlined />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-rose-50/60 group"
            onClick={() => handleOpenUserKpi("Danh sách Tài khoản Bị khóa", (users || []).filter((u) => u.enabled === false))}
          >
            <Statistic
              title={<span className="text-xs font-bold uppercase text-rose-700">Tài khoản bị khóa</span>}
              value={lockedCount}
              suffix={<span className="text-xs text-gray-400 font-normal">tài khoản</span>}
              prefix={<StopOutlined className="text-rose-500 mr-1" />}
              styles={{ content: { fontWeight: 900, color: "#9f1239" } }}
            />
            <div className="mt-2 text-xs text-rose-600 font-medium flex items-center justify-between group-hover:underline">
              <span>Xem danh sách vi phạm</span>
              <EyeOutlined />
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── SEARCH & TABLE CARD ── */}
      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between mb-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Input
              placeholder="Tìm tên, username, email, SĐT khách hàng..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              allowClear
              className="w-full sm:w-80 rounded-xl"
            />

            <Select
              value={userTierFilter}
              onChange={setUserTierFilter}
              className="w-48"
            >
              <Option value="ALL">Tất cả hạng thẻ</Option>
              <Option value="VIP">Hạng VIP</Option>
              <Option value="GOLD">Hạng Vàng (Gold)</Option>
              <Option value="SILVER">Hạng Bạc (Silver)</Option>
              <Option value="STANDARD">Hạng Chuẩn (Standard)</Option>
            </Select>
          </div>

          <div className="text-xs text-gray-500">
            Hiển thị <strong>{filteredUsers.length}</strong> / {users.length} tài khoản khách hàng
          </div>
        </div>

        <Table
          dataSource={filteredUsers}
          columns={columns}
          rowKey={(r) => r.id || r.username}
          scroll={{ x: 900 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            showSizeChanger: true,
            pageSizeOptions: ["8", "16", "32", "50"],
            showTotal: (total) => `Tổng ${total} khách hàng`,
            onChange: (current, pageSize) => setPagination({ current, pageSize }),
          }}
          className="border border-gray-100 rounded-xl overflow-hidden"
        />
      </Card>

      {/* ── MODAL: CUSTOMER PROFILE & ORDER/BOOKING HISTORY ── */}
      <Modal
        title={
          <div className="font-bold text-base text-gray-800 flex items-center gap-2">
            <UserOutlined className="text-blue-600" />
            <span>Hồ sơ chi tiết khách hàng & Lịch sử hoạt động (Database)</span>
          </div>
        }
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false);
          setDetailSummary(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setDetailModalOpen(false);
              setDetailSummary(null);
            }}
            className="rounded-lg"
          >
            Đóng
          </Button>,
          <Button
            key="edit"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setDetailModalOpen(false);
              handleOpenEdit(selectedUser);
            }}
            className="rounded-lg bg-blue-600"
          >
            Chỉnh sửa thông tin
          </Button>,
        ]}
        width={900}
        centered
        destroyOnHidden
      >
        <Spin spinning={loadingDetail} tip="Đang truy vấn dữ liệu từ database...">
          {selectedUser && (
            <div className="space-y-5 mt-3 max-h-[75vh] overflow-y-auto pr-1">
              {/* Banner Header giống như ở UserProfilePage */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="h-28 bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-400 relative p-4">
                  <div className="absolute top-3 right-4 flex items-center gap-2">
                    <Tag
                      color={TIER_COLORS[selectedUser.membershipTier] || "cyan"}
                      className="px-3 py-1 font-bold text-xs rounded-full border-none shadow-sm flex items-center gap-1.5"
                    >
                      <CrownOutlined /> {selectedUser.membershipTier || "STANDARD"} HỘI VIÊN
                    </Tag>
                  </div>

                  <div className="absolute -bottom-10 left-6 flex items-end gap-4">
                    <Avatar
                      size={80}
                      src={selectedUser.avatarUrl}
                      icon={<UserOutlined />}
                      className="border-4 border-white shadow-md bg-blue-500 text-white shrink-0"
                    />
                    <div className="mb-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-gray-900 mb-0">
                          {selectedUser.fullName || selectedUser.username || "Khách hàng"}
                        </h2>
                        {selectedUser.emailVerified ? (
                          <Tag color="success" className="rounded-full text-[11px] font-bold border-none flex items-center gap-1">
                            <CheckCircleOutlined /> Đã xác thực
                          </Tag>
                        ) : (
                          <Tag color="warning" className="rounded-full text-[11px] font-bold border-none flex items-center gap-1">
                            <ExclamationCircleOutlined /> Chưa xác thực
                          </Tag>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs font-medium">@{selectedUser.username || "user"}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-12 pb-4 px-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-slate-50/50">
                  <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <CalendarOutlined className="text-blue-500" /> Tham gia: <strong>{formatDateTime(selectedUser.createdAt)}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <HomeOutlined className="text-blue-500" /> Khu vực: <strong>{[selectedUser.district, selectedUser.city].filter(Boolean).join(", ") || "Chưa cập nhật"}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <SafetyCertificateOutlined className="text-blue-500" /> Trạng thái:
                      <Tag color={selectedUser.enabled !== false ? "success" : "error"} className="rounded-full text-xs font-bold border-none">
                        {selectedUser.enabled !== false ? "HOẠT ĐỘNG" : "BỊ KHÓA"}
                      </Tag>
                    </span>
                  </div>
                </div>

                {/* Thông tin hồ sơ chi tiết từ Database */}
                <div className="p-5">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100 space-y-2.5 h-full">
                        <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider text-blue-600 flex items-center gap-2 mb-2">
                          <UserOutlined /> Thông tin cá nhân (Database)
                        </h4>

                        <div className="flex justify-between items-center py-1.5 border-b border-gray-100 text-xs">
                          <span className="text-gray-500">Họ và tên:</span>
                          <span className="font-bold text-gray-800">{selectedUser.fullName || "—"}</span>
                        </div>

                        <div className="flex justify-between items-center py-1.5 border-b border-gray-100 text-xs">
                          <span className="text-gray-500">Tên tài khoản:</span>
                          <span className="font-bold text-gray-800">@{selectedUser.username || "—"}</span>
                        </div>

                        <div className="flex justify-between items-center py-1.5 border-b border-gray-100 text-xs">
                          <span className="text-gray-500">Giới tính:</span>
                          <span className="font-bold text-gray-800">{formatGender(selectedUser.gender)}</span>
                        </div>

                        <div className="flex justify-between items-center py-1.5 border-b border-gray-100 text-xs">
                          <span className="text-gray-500">Hạng thành viên:</span>
                          <Tag color={TIER_COLORS[selectedUser.membershipTier] || "cyan"} className="font-bold text-xs">
                            {selectedUser.membershipTier || "STANDARD"}
                          </Tag>
                        </div>

                        <div className="flex justify-between items-center py-1.5 text-xs">
                          <span className="text-gray-500">Mã voucher / ưu đãi:</span>
                          <span className="font-medium text-amber-600">{selectedUser.voucherCode || "Không có"}</span>
                        </div>
                      </div>
                    </Col>

                    <Col xs={24} md={12}>
                      <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100 space-y-2.5 h-full">
                        <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider text-blue-600 flex items-center gap-2 mb-2">
                          <MailOutlined /> Liên hệ & Địa chỉ (Database)
                        </h4>

                        <div className="flex justify-between items-center py-1.5 border-b border-gray-100 text-xs">
                          <span className="text-gray-500">Email:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-gray-800">{selectedUser.email || "—"}</span>
                            {selectedUser.emailVerified ? (
                              <Tag color="success" className="text-[10px] py-0 px-1 border-none font-bold">Đã xác thực</Tag>
                            ) : (
                              <Tag color="warning" className="text-[10px] py-0 px-1 border-none">Chưa xác thực</Tag>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center py-1.5 border-b border-gray-100 text-xs">
                          <span className="text-gray-500">Số điện thoại:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-gray-800">{selectedUser.phoneNumber || "Chưa cập nhật"}</span>
                            {selectedUser.phoneVerified && (
                              <Tag color="processing" className="text-[10px] py-0 px-1 border-none">Đã xác minh</Tag>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-start py-1.5 border-b border-gray-100 text-xs">
                          <span className="text-gray-500 shrink-0">Địa chỉ cụ thể:</span>
                          <span className="font-bold text-gray-800 text-right">
                            {selectedUser.address || "Chưa cập nhật địa chỉ"}
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-1.5 border-b border-gray-100 text-xs">
                          <span className="text-gray-500">Phường / Xã:</span>
                          <span className="font-bold text-gray-800">{selectedUser.ward || "—"}</span>
                        </div>

                        <div className="flex justify-between items-center py-1.5 border-b border-gray-100 text-xs">
                          <span className="text-gray-500">Quận / Huyện:</span>
                          <span className="font-bold text-gray-800">{selectedUser.district || "—"}</span>
                        </div>

                        <div className="flex justify-between items-center py-1.5 text-xs">
                          <span className="text-gray-500">Tỉnh / Thành phố:</span>
                          <span className="font-bold text-blue-700">{selectedUser.city || "—"}</span>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>

              {/* Thống kê giao dịch tóm tắt */}
              <Row gutter={[12, 12]}>
                <Col span={6}>
                  <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 text-center">
                    <div className="text-[11px] font-bold text-blue-700 uppercase">Lượt đặt lịch</div>
                    <div className="text-lg font-black text-blue-900 mt-0.5">{displayBookings.length}</div>
                  </div>
                </Col>
                <Col span={6}>
                  <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 text-center">
                    <div className="text-[11px] font-bold text-emerald-700 uppercase">Tiền dịch vụ</div>
                    <div className="text-sm font-black text-emerald-900 mt-1 truncate">{formatCurrency(displayTotalBookingSpent)}</div>
                  </div>
                </Col>
                <Col span={6}>
                  <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-100 text-center">
                    <div className="text-[11px] font-bold text-purple-700 uppercase">Đơn mua hàng</div>
                    <div className="text-lg font-black text-purple-900 mt-0.5">{displayOrders.length}</div>
                  </div>
                </Col>
                <Col span={6}>
                  <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-100 text-center">
                    <div className="text-[11px] font-bold text-amber-700 uppercase">Tiền mua hàng</div>
                    <div className="text-sm font-black text-amber-900 mt-1 truncate">{formatCurrency(displayTotalOrderSpent)}</div>
                  </div>
                </Col>
              </Row>

              {/* Tabs Lịch sử đặt lịch và Mua hàng chuẩn xác từ Database */}
              <Tabs
                defaultActiveKey="bookings"
                items={[
                  {
                    key: "bookings",
                    label: (
                      <span className="font-bold flex items-center gap-1.5 text-blue-700">
                        <CalendarOutlined /> Phần 1: Dịch vụ - Lịch sử đặt lịch ({displayBookings.length})
                      </span>
                    ),
                    children: (
                      <Table
                        dataSource={displayBookings}
                        rowKey={(r) => r.id || r.bookingCode}
                        size="small"
                        pagination={{ pageSize: 5 }}
                        columns={[
                          {
                            title: "Mã lịch",
                            dataIndex: "bookingCode",
                            render: (v, r) => (
                              <span className="font-mono text-xs font-bold text-blue-600">{v || r.id?.slice?.(0, 8) || "—"}</span>
                            ),
                          },
                          {
                            title: "Thời gian hẹn",
                            key: "time",
                            render: (_, r) => (
                              <span className="text-xs text-gray-700 font-medium">
                                {formatFullDateTime(r.startTime || r.bookingDate)}
                              </span>
                            ),
                          },
                          {
                            title: "Dịch vụ",
                            key: "service",
                            render: (_, r) => (
                              <span className="text-xs font-semibold text-gray-800">
                                {r.serviceName || (Array.isArray(r.serviceNames) && r.serviceNames.length > 0 ? r.serviceNames.join(", ") : (Array.isArray(r.services) ? r.services.map((s) => s.name || s.serviceName).join(", ") : (r.totalServices ? `${r.totalServices} dịch vụ` : "Dịch vụ làm đẹp")))}
                              </span>
                            ),
                          },
                          {
                            title: "Salon & Stylist",
                            key: "salon",
                            render: (_, r) => (
                              <div className="text-xs">
                                <div className="font-medium text-gray-800">{r.salonName || "Salon"}</div>
                                <div className="text-gray-400 text-[11px]">Thợ: {r.stylistName || "—"}</div>
                              </div>
                            ),
                          },
                          {
                            title: "Tổng tiền",
                            dataIndex: "totalAmount",
                            render: (v) => <span className="font-bold text-blue-700">{formatCurrency(v)}</span>,
                          },
                          {
                            title: "Trạng thái",
                            dataIndex: "status",
                            render: (v) => {
                              const color =
                                v === "COMPLETED" ? "success" :
                                v === "CONFIRMED" ? "processing" :
                                v === "CANCELLED" ? "error" : "warning";
                              return <Tag color={color} className="font-bold text-xs">{v || "PENDING"}</Tag>;
                            },
                          },
                        ]}
                      />
                    ),
                  },
                  {
                    key: "orders",
                    label: (
                      <span className="font-bold flex items-center gap-1.5 text-purple-700">
                        <ShoppingOutlined /> Phần 2: Sản phẩm - Đơn mua hàng Shop ({displayOrders.length})
                      </span>
                    ),
                    children: (
                      <Table
                        dataSource={displayOrders}
                        rowKey={(r) => r.id || r.orderCode || r.orderId}
                        size="small"
                        pagination={{ pageSize: 5 }}
                        columns={[
                          {
                            title: "Mã đơn",
                            dataIndex: "orderCode",
                            render: (v, r) => (
                              <span className="font-mono text-xs font-bold text-purple-600">{v || r.id?.slice?.(0, 8) || "—"}</span>
                            ),
                          },
                          {
                            title: "Thời gian đặt",
                            key: "orderTime",
                            render: (_, r) => (
                              <span className="text-xs text-gray-700 font-medium">
                                {formatFullDateTime(r.createdAt)}
                              </span>
                            ),
                          },
                          {
                            title: "Sản phẩm",
                            key: "items",
                            render: (_, r) => (
                              <div className="max-w-[220px]">
                                {Array.isArray(r.items) && r.items.length > 0 ? (
                                  r.items.map((it, idx) => (
                                    <div key={idx} className="text-xs truncate text-gray-700">
                                      • {it.productName || "Sản phẩm"} <span className="text-gray-400 font-medium">x{it.quantity || 1}</span>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-xs text-gray-500">Đơn hàng sản phẩm</span>
                                )}
                              </div>
                            ),
                          },
                          {
                            title: "Tổng thanh toán",
                            key: "amount",
                            render: (_, r) => (
                              <span className="font-bold text-purple-700">
                                {formatCurrency(r.finalAmount ?? r.totalAmount)}
                              </span>
                            ),
                          },
                          {
                            title: "Phương thức",
                            dataIndex: "paymentMethod",
                            render: (v) => (
                              <Tag color={v === "VNPAY" ? "blue" : v === "BANK_TRANSFER" ? "green" : "default"} className="text-xs font-bold">
                                {v === "VNPAY" ? "VNPay" : v === "BANK_TRANSFER" ? "Chuyển khoản (VietQR)" : "Tiền mặt / COD"}
                              </Tag>
                            ),
                          },
                          {
                            title: "Trạng thái",
                            key: "status",
                            render: (_, r) => {
                              const status = r.status || r.orderStatus;
                              const color =
                                status === "DELIVERED" ? "success" :
                                status === "SHIPPING" ? "cyan" :
                                status === "CONFIRMED" ? "blue" :
                                status === "CANCELLED" ? "error" : "processing";
                              const text =
                                status === "DELIVERED" ? "Đã giao hàng" :
                                status === "SHIPPING" ? "Đang giao hàng" :
                                status === "CONFIRMED" ? "Đã xác nhận" :
                                status === "CANCELLED" ? "Đã hủy" : "Chờ xử lý";
                              return <Tag color={color} className="font-bold text-xs">{text}</Tag>;
                            },
                          },
                        ]}
                      />
                    ),
                  },
                ]}
              />
            </div>
          )}
        </Spin>
      </Modal>

      {/* ── MODAL: EDIT CUSTOMER INFO ── */}
      <Modal
        title="Chỉnh sửa thông tin khách hàng"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleSaveEdit}
        confirmLoading={savingEdit}
        okText="Lưu thông tin"
        cancelText="Hủy"
        destroyOnHidden
        centered
        width={650}
      >
        <Form form={editForm} layout="vertical" className="mt-4">
          <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}>
            <Input placeholder="Nguyễn Văn A" className="rounded-xl" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="phoneNumber" label="Số điện thoại">
                <Input placeholder="0988..." className="rounded-xl" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="Email">
                <Input placeholder="email@gmail.com" className="rounded-xl" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="membershipTier" label="Hạng thành viên">
                <Select className="rounded-xl">
                  <Option value="STANDARD">Hạng Chuẩn (Standard)</Option>
                  <Option value="SILVER">Hạng Bạc (Silver)</Option>
                  <Option value="GOLD">Hạng Vàng (Gold)</Option>
                  <Option value="VIP">Hạng VIP</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gender" label="Giới tính">
                <Select className="rounded-xl">
                  <Option value="Nam">Nam</Option>
                  <Option value="Nữ">Nữ</Option>
                  <Option value="Khác">Khác</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="city" label="Tỉnh / Thành phố">
                <Input placeholder="Hà Nội, TP.HCM..." className="rounded-xl" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="district" label="Quận / Huyện">
                <Input placeholder="Cầu Giấy, Hoàn Kiếm..." className="rounded-xl" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="ward" label="Phường / Xã">
                <Input placeholder="Dịch Vọng..." className="rounded-xl" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="Địa chỉ cụ thể (Số nhà, đường)">
            <Input placeholder="Số nhà, đường..." className="rounded-xl" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="emailVerified" label="Trạng thái xác thực Email" valuePropName="checked">
                <Switch checkedChildren="Đã xác thực" unCheckedChildren="Chưa xác thực" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="enabled" label="Trạng thái tài khoản" valuePropName="checked">
                <Switch checkedChildren="Hoạt động" unCheckedChildren="Khóa" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>


      {/* ── MODAL: RESET PASSWORD ── */}
      <Modal
        title={`Đặt lại mật khẩu cho @${resetPwdUser?.username}`}
        open={resetPwdModalOpen}
        onCancel={() => setResetPwdModalOpen(false)}
        onOk={handleSaveResetPwd}
        confirmLoading={resettingPwd}
        okText="Cập nhật mật khẩu"
        cancelText="Hủy"
        destroyOnHidden
        centered
      >
        <Form form={pwdForm} layout="vertical" className="mt-4">
          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu mới!" },
              { min: 6, message: "Mật khẩu tối thiểu 6 ký tự!" },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu mới cho khách hàng" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── MODAL: KPI USERS LIST DRILL-DOWN ── */}
      <Modal
        title={<span className="font-bold text-gray-800">{kpiUserModalTitle} ({kpiUserModalList.length})</span>}
        open={kpiUserModalOpen}
        onCancel={() => setKpiUserModalOpen(false)}
        footer={null}
        width={800}
        centered
        destroyOnHidden
      >
        <div className="mt-4">
          <Table
            dataSource={kpiUserModalList}
            rowKey={(r) => r.id || r.username}
            size="small"
            pagination={{ pageSize: 6 }}
            columns={[
              {
                title: "Khách hàng",
                dataIndex: "fullName",
                render: (v, r) => (
                  <div className="flex items-center gap-2">
                    <Avatar size={28} src={r.avatarUrl} icon={<UserOutlined />} />
                    <div>
                      <div className="font-bold text-xs">{v || r.username}</div>
                      <div className="text-[10px] text-gray-400">@{r.username}</div>
                    </div>
                  </div>
                ),
              },
              {
                title: "Liên hệ",
                dataIndex: "phoneNumber",
                render: (v, r) => (
                  <div className="text-xs">
                    <div>📞 {v || "—"}</div>
                    <div className="text-[10px] text-gray-400">{r.email || "—"}</div>
                  </div>
                ),
              },
              {
                title: "Hạng thẻ",
                dataIndex: "membershipTier",
                render: (v) => <Tag color={TIER_COLORS[v] || "cyan"}>{v || "STANDARD"}</Tag>,
              },
              {
                title: "Trạng thái",
                dataIndex: "enabled",
                render: (v) => (
                  <Tag color={v !== false ? "success" : "error"}>
                    {v !== false ? "Hoạt động" : "Bị khóa"}
                  </Tag>
                ),
              },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}
