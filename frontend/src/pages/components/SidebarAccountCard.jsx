import React, { useState, useRef } from "react";
import {
  Avatar,
  Dropdown,
  Modal,
  Form,
  Input,
  Button,
  Tag,
  Divider,
  message,
  Spin,
  Descriptions,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  LogoutOutlined,
  RightOutlined,
  CameraOutlined,
  SaveOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  SafetyCertificateOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { updateMyProfile, uploadUserAvatar } from "../../service/api/userApi";
import { uploadStylistAvatar } from "../../service/api/adminApi";
import { useAuth } from "../../auth/authProvider";

export default function SidebarAccountCard({
  user,
  roleLabel = "Quản trị viên",
  collapsed = false,
  onLogout,
  onProfileUpdated,
  isStylist = false,
  stylistProfile = null,
}) {
  const { checkCurrentSession } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [form] = Form.useForm();
  const fileInputRef = useRef(null);

  const currentFullName = user?.fullName || user?.username || "Người dùng";
  const currentUsername = user?.username || "user";
  const currentAvatar = user?.avatarUrl || stylistProfile?.avatarUrl;
  const firstLetter = (currentFullName.trim().charAt(0) || "B").toUpperCase();

  // Open modal in View mode
  const handleOpenViewProfile = () => {
    setIsEditing(false);
    setDropdownOpen(false);
    setProfileModalOpen(true);
  };

  // Open modal in Edit mode
  const handleOpenEditProfile = () => {
    setIsEditing(true);
    setDropdownOpen(false);
    form.setFieldsValue({
      fullName: user?.fullName || "",
      phoneNumber: user?.phoneNumber || "",
      email: user?.email || "",
      address: user?.address || "",
    });
    setProfileModalOpen(true);
  };

  // Trigger avatar file selection
  const handleSelectAvatarFile = () => {
    if (uploadingAvatar) return;
    fileInputRef.current?.click();
  };

  // Handle avatar upload
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      message.error("Vui lòng chọn file hình ảnh (JPG, PNG, WEBP)!");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      message.error("Kích thước file tối đa là 10MB!");
      return;
    }

    try {
      setUploadingAvatar(true);
      if (isStylist && (stylistProfile?.id || user?.id)) {
        await uploadStylistAvatar(stylistProfile?.id || user?.id, file);
      } else {
        await uploadUserAvatar(file);
      }
      message.success("Cập nhật ảnh đại diện thành công!");
      if (checkCurrentSession) await checkCurrentSession();
      if (onProfileUpdated) onProfileUpdated();
    } catch (err) {
      console.error("Lỗi tải ảnh đại diện:", err);
      message.error(err?.response?.data?.message || "Tải ảnh đại diện thất bại!");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Save profile edit
  const handleSaveProfile = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await updateMyProfile({
        fullName: values.fullName,
        phoneNumber: values.phoneNumber,
        address: values.address,
      });
      message.success("Cập nhật thông tin cá nhân thành công!");
      setIsEditing(false);
      if (checkCurrentSession) await checkCurrentSession();
      if (onProfileUpdated) onProfileUpdated();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err?.response?.data?.message || "Cập nhật thất bại, vui lòng thử lại!");
    } finally {
      setSaving(false);
    }
  };

  // ChatGPT-style menu content
  const dropdownMenu = (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 w-64 text-gray-700">
      {/* Header Profile preview */}
      <div
        className="flex items-center gap-3 p-2.5 bg-slate-50/80 rounded-xl mb-1.5 cursor-pointer hover:bg-slate-100 transition-colors"
        onClick={handleOpenViewProfile}
      >
        <Avatar
          size={38}
          src={currentAvatar}
          className="bg-emerald-600 text-white font-black shrink-0"
        >
          {firstLetter}
        </Avatar>
        <div className="overflow-hidden flex-1">
          <div className="font-bold text-xs text-gray-900 truncate">
            {currentFullName}
          </div>
          <div className="text-[11px] text-gray-500 font-medium truncate">
            {roleLabel}
          </div>
        </div>
        <RightOutlined className="text-gray-400 text-[10px]" />
      </div>

      {/* Menu options */}
      <div className="space-y-0.5 pt-1">
        <button
          type="button"
          onClick={handleOpenViewProfile}
          className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-gray-100 transition-colors text-gray-700"
        >
          <UserOutlined className="text-gray-500 text-sm" />
          <span>Hồ sơ cá nhân</span>
        </button>

        <button
          type="button"
          onClick={handleOpenEditProfile}
          className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-gray-100 transition-colors text-gray-700"
        >
          <EditOutlined className="text-gray-500 text-sm" />
          <span>Chỉnh sửa thông tin</span>
        </button>
      </div>

      <Divider className="my-1.5 border-gray-100" />

      {/* Logout option */}
      <button
        type="button"
        onClick={() => {
          setDropdownOpen(false);
          if (onLogout) onLogout();
        }}
        className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
      >
        <LogoutOutlined className="text-rose-500 text-sm" />
        <span>Đăng xuất</span>
      </button>
    </div>
  );

  return (
    <>
      {/* Hidden file input for Avatar Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFileChange}
      />

      {/* ── BOTTOM ACCOUNT CARD ── */}
      <div className="p-3 border-t border-gray-100 bg-white shrink-0">
        <Dropdown
          open={dropdownOpen}
          onOpenChange={setDropdownOpen}
          trigger={["click"]}
          placement="topRight"
          dropdownRender={() => dropdownMenu}
        >
          <div
            className={`flex items-center ${
              collapsed ? "justify-center" : "justify-between"
            } p-2 rounded-xl hover:bg-gray-100/90 cursor-pointer transition-all group select-none`}
            title={collapsed ? `${currentFullName} (${roleLabel})` : ""}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Avatar
                size={36}
                src={currentAvatar}
                className="bg-emerald-600 text-white font-black shrink-0 border border-emerald-500/30"
              >
                {firstLetter}
              </Avatar>

              {!collapsed && (
                <div className="overflow-hidden text-left">
                  <div className="font-bold text-xs text-gray-900 truncate">
                    {currentFullName}
                  </div>
                  <div className="text-[11px] text-gray-400 font-medium truncate">
                    {roleLabel}
                  </div>
                </div>
              )}
            </div>

            {!collapsed && (
              <RightOutlined className="text-gray-400 text-xs group-hover:text-gray-600 ml-1 shrink-0" />
            )}
          </div>
        </Dropdown>
      </div>

      {/* ── MODAL: USER PROFILE & EDIT ── */}
      <Modal
        title={
          <div className="flex items-center gap-2 font-bold text-base text-gray-800">
            <UserOutlined className="text-blue-600" />
            <span>{isEditing ? "Chỉnh sửa thông tin tài khoản" : "Thông tin tài khoản cá nhân"}</span>
          </div>
        }
        open={profileModalOpen}
        onCancel={() => setProfileModalOpen(false)}
        footer={null}
        width={560}
        centered
        destroyOnHidden
      >
        <div className="py-2 space-y-5">
          {/* Avatar & Header Banner */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl border border-gray-100">
            <div className="relative group shrink-0">
              <Avatar
                size={64}
                src={currentAvatar}
                className="bg-emerald-600 text-white font-extrabold text-2xl border-2 border-white shadow-sm"
              >
                {firstLetter}
              </Avatar>
              <button
                type="button"
                onClick={handleSelectAvatarFile}
                disabled={uploadingAvatar}
                className="absolute inset-0 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-xs font-semibold"
                title="Thay đổi ảnh đại diện từ máy tính hoặc điện thoại"
              >
                {uploadingAvatar ? (
                  <LoadingOutlined className="text-lg" />
                ) : (
                  <>
                    <CameraOutlined className="text-base mb-0.5" />
                    <span className="text-[9px]">Đổi ảnh</span>
                  </>
                )}
              </button>
            </div>

            <div className="overflow-hidden flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-extrabold text-base text-gray-900 mb-0 truncate">
                  {currentFullName}
                </h3>
                <Tag color="blue" className="font-bold text-[10px] px-1.5 py-0 leading-none">
                  {roleLabel}
                </Tag>
              </div>
              <p className="text-xs text-gray-400 mb-1">@{currentUsername}</p>
              <Button
                size="small"
                icon={<CameraOutlined />}
                onClick={handleSelectAvatarFile}
                loading={uploadingAvatar}
                className="text-xs rounded-lg"
              >
                Tải ảnh mới
              </Button>
            </div>
          </div>

          {/* Body: View Mode or Edit Mode */}
          {!isEditing ? (
            <div className="space-y-4">
              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="Họ và tên">
                  <strong>{user?.fullName || "Chưa cập nhật"}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Tên đăng nhập">
                  @{currentUsername}
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                  {user?.phoneNumber || "Chưa cập nhật"}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {user?.email || "Chưa cập nhật"}
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ">
                  {user?.address || "Chưa cập nhật địa chỉ"}
                </Descriptions.Item>
                {isStylist && stylistProfile?.salonName && (
                  <Descriptions.Item label="Cơ sở trực thuộc">
                    <strong>📍 {stylistProfile.salonName}</strong>
                  </Descriptions.Item>
                )}
              </Descriptions>

              <div className="flex items-center justify-between pt-2">
                <Button
                  danger
                  icon={<LogoutOutlined />}
                  onClick={() => {
                    setProfileModalOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="rounded-xl font-semibold text-xs"
                >
                  Đăng xuất
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setProfileModalOpen(false)}
                    className="rounded-xl text-xs"
                  >
                    Đóng
                  </Button>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={handleOpenEditProfile}
                    className="rounded-xl font-semibold text-xs bg-blue-600"
                  >
                    Chỉnh sửa hồ sơ
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Form form={form} layout="vertical" onFinish={handleSaveProfile} className="space-y-3">
              <Form.Item
                name="fullName"
                label={<span className="text-xs font-bold text-gray-700">Họ và tên</span>}
                rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}
              >
                <Input placeholder="Nguyễn Văn A" className="rounded-xl" />
              </Form.Item>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Form.Item
                  name="phoneNumber"
                  label={<span className="text-xs font-bold text-gray-700">Số điện thoại</span>}
                  rules={[{ required: true, message: "Vui lòng nhập số điện thoại!" }]}
                >
                  <Input placeholder="0988..." className="rounded-xl" />
                </Form.Item>

                <Form.Item
                  name="email"
                  label={<span className="text-xs font-bold text-gray-700">Email</span>}
                  rules={[{ type: "email", message: "Email không đúng định dạng!" }]}
                >
                  <Input placeholder="email@gmail.com" className="rounded-xl" />
                </Form.Item>
              </div>

              <Form.Item
                name="address"
                label={<span className="text-xs font-bold text-gray-700">Địa chỉ liên hệ</span>}
              >
                <Input placeholder="Số nhà, đường, phường, quận..." className="rounded-xl" />
              </Form.Item>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <Button
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl text-xs"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={saving}
                  className="rounded-xl font-semibold text-xs bg-blue-600"
                >
                  Lưu thay đổi
                </Button>
              </div>
            </Form>
          )}
        </div>
      </Modal>
    </>
  );
}

