import React, { useState, useEffect } from 'react';
import {
  Card,
  Avatar,
  Tag,
  Button,
  Input,
  Select,
  Modal,
  message,
  Spin,
  Divider,
  Row,
  Col,
  Descriptions,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  CrownOutlined,
  CalendarOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../auth/authProvider';
import {
  getMyProfile,
  updateMyProfile,
  sendVerifyEmailOtp,
  verifyEmailOtp,
} from '../../service/api/userApi';

const { Option } = Select;

export default function UserProfilePage() {
  const { userInfo } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state for editing
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    gender: 'OTHER',
    address: '',
    city: '',
    district: '',
    ward: '',
    avatarUrl: '',
  });

  // Verify Email Modal state
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Load user profile
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await getMyProfile();
      setProfile(data);
      setFormData({
        fullName: data.fullName || '',
        phoneNumber: data.phoneNumber || '',
        gender: data.gender || 'OTHER',
        address: data.address || '',
        city: data.city || '',
        district: data.district || '',
        ward: data.ward || '',
        avatarUrl: data.avatarUrl || '',
      });
    } catch (err) {
      console.warn('Could not fetch profile via /users/me, falling back to auth session:', err);
      if (userInfo) {
        setProfile(userInfo);
        setFormData({
          fullName: userInfo.fullName || '',
          phoneNumber: userInfo.phoneNumber || '',
          gender: userInfo.gender || 'OTHER',
          address: userInfo.address || '',
          city: userInfo.city || '',
          district: userInfo.district || '',
          ward: userInfo.ward || '',
          avatarUrl: userInfo.avatarUrl || '',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Cooldown timer for OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const updated = await updateMyProfile(formData);
      setProfile(updated);
      setEditing(false);
      message.success('Cập nhật thông tin tài khoản thành công!');
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || 'Cập nhật thông tin thất bại!');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenVerifyModal = async () => {
    setVerifyModalVisible(true);
    setOtpCode('');
    if (countdown === 0) {
      await handleSendOtp();
    }
  };

  const handleSendOtp = async () => {
    try {
      setSendingOtp(true);
      await sendVerifyEmailOtp();
      message.success('Mã OTP xác thực đã được gửi tới email của bạn!');
      setCountdown(60);
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể gửi mã OTP. Vui lòng thử lại sau!');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      message.warning('Vui lòng nhập đầy đủ mã OTP 6 chữ số!');
      return;
    }

    try {
      setVerifyingOtp(true);
      await verifyEmailOtp(otpCode.trim());
      message.success('Chúc mừng! Email của bạn đã được xác thực thành công.');
      setVerifyModalVisible(false);
      setProfile((prev) => ({ ...prev, emailVerified: true }));
    } catch (err) {
      message.error(err.response?.data?.message || 'Mã OTP không đúng hoặc đã hết hiệu lực!');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const getTierColor = (tier) => {
    switch (tier?.toUpperCase()) {
      case 'VIP':
        return '#f59e0b';
      case 'GOLD':
        return '#eab308';
      case 'SILVER':
        return '#94a3b8';
      default:
        return '#60a5fa';
    }
  };

  const formatGender = (gender) => {
    switch (gender?.toUpperCase()) {
      case 'MALE':
        return 'Nam';
      case 'FEMALE':
        return 'Nữ';
      default:
        return 'Khác';
    }
  };

  const formatDateTime = (dt) => {
    if (!dt) return 'Mới tham gia';
    try {
      const d = Array.isArray(dt) ? new Date(...dt) : new Date(dt);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return 'Mới tham gia';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-20">
        <Spin size="large" tip="Đang tải thông tin tài khoản..." />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Banner Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="h-32 bg-gradient-to-r from-blue-400 via-[#60a5fa] to-indigo-400 relative">
          <div className="absolute -bottom-12 left-8 flex items-end gap-5">
            <Avatar
              size={96}
              src={profile?.avatarUrl}
              icon={<UserOutlined />}
              className="border-4 border-white shadow-md bg-[#60a5fa] text-white"
            />
            <div className="mb-2">
              <h1 className="text-2xl font-black text-gray-900 mb-0">
                {profile?.fullName || profile?.username || 'Khách hàng'}
              </h1>
              <p className="text-gray-500 text-xs font-medium">@{profile?.username || 'user'}</p>
            </div>
          </div>

          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Tag
              color={getTierColor(profile?.membershipTier)}
              className="px-3 py-1 font-bold text-xs rounded-full border-none shadow-sm flex items-center gap-1"
            >
              <CrownOutlined /> {profile?.membershipTier || 'STANDARD'} HỘI VIÊN
            </Tag>
          </div>
        </div>

        <div className="pt-16 pb-6 px-8 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <CalendarOutlined className="text-[#60a5fa]" /> Tham gia: {formatDateTime(profile?.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <SafetyCertificateOutlined className="text-[#60a5fa]" /> Trạng thái:
              <Tag color="success" className="rounded-full text-xs font-bold border-none">
                Đang hoạt động
              </Tag>
            </span>
          </div>

          {!editing ? (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setEditing(true)}
              className="bg-[#60a5fa] hover:bg-blue-500 rounded-xl font-bold text-xs h-9 shadow-sm"
            >
              Chỉnh sửa thông tin
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                icon={<CloseOutlined />}
                onClick={() => setEditing(false)}
                className="rounded-xl text-xs h-9"
              >
                Hủy
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={handleSaveProfile}
                className="bg-[#60a5fa] hover:bg-blue-500 rounded-xl font-bold text-xs h-9 shadow-sm"
              >
                Lưu thay đổi
              </Button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-8">
          {!editing ? (
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 space-y-4">
                  <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-2 text-[#60a5fa] flex items-center gap-2">
                    <UserOutlined /> Thông tin cơ bản
                  </h3>

                  <div className="flex justify-between items-center py-2 border-b border-gray-100 text-sm">
                    <span className="text-gray-500">Họ và tên:</span>
                    <span className="font-bold text-gray-800">{profile?.fullName || '—'}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-100 text-sm">
                    <span className="text-gray-500">Tên tài khoản:</span>
                    <span className="font-bold text-gray-800">{profile?.username || '—'}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-100 text-sm">
                    <span className="text-gray-500">Giới tính:</span>
                    <span className="font-bold text-gray-800">{formatGender(profile?.gender)}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 text-sm">
                    <span className="text-gray-500">Hạng thành viên:</span>
                    <span className="font-bold text-amber-600">{profile?.membershipTier || 'STANDARD'}</span>
                  </div>
                </div>
              </Col>

              <Col xs={24} md={12}>
                <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 space-y-4">
                  <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-2 text-[#60a5fa] flex items-center gap-2">
                    <MailOutlined /> Liên hệ & Xác thực
                  </h3>

                  <div className="flex justify-between items-center py-2 border-b border-gray-100 text-sm">
                    <span className="text-gray-500">Email:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">{profile?.email || '—'}</span>
                      {profile?.emailVerified ? (
                        <Tag color="success" className="rounded-full text-[11px] font-bold border-none flex items-center gap-1">
                          <CheckCircleOutlined /> Đã xác thực
                        </Tag>
                      ) : (
                        <Button
                          size="small"
                          type="primary"
                          danger
                          onClick={handleOpenVerifyModal}
                          className="text-[11px] font-bold rounded-lg h-6 px-2"
                        >
                          Xác thực ngay
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-100 text-sm">
                    <span className="text-gray-500">Số điện thoại:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">{profile?.phoneNumber || 'Chưa cập nhật'}</span>
                      {profile?.phoneVerified && (
                        <Tag color="processing" className="rounded-full text-[11px] font-bold border-none">
                          Đã xác minh
                        </Tag>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-start py-2 text-sm">
                    <span className="text-gray-500 shrink-0">Địa chỉ:</span>
                    <span className="font-bold text-gray-800 text-right">
                      {[profile?.address, profile?.ward, profile?.district, profile?.city]
                        .filter(Boolean)
                        .join(', ') || 'Chưa cập nhật'}
                    </span>
                  </div>
                </div>
              </Col>
            </Row>
          ) : (
            /* Editing Form */
            <div className="space-y-6">
              <Row gutter={[20, 20]}>
                <Col xs={24} sm={12}>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                    Họ và tên
                  </label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Nhập họ và tên đầy đủ"
                    className="rounded-xl h-11"
                  />
                </Col>

                <Col xs={24} sm={12}>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                    Số điện thoại
                  </label>
                  <Input
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="VD: 0987654321"
                    className="rounded-xl h-11"
                  />
                </Col>

                <Col xs={24} sm={12}>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                    Giới tính
                  </label>
                  <Select
                    value={formData.gender}
                    onChange={(val) => setFormData({ ...formData, gender: val })}
                    className="w-full h-11 rounded-xl"
                  >
                    <Option value="MALE">Nam</Option>
                    <Option value="FEMALE">Nữ</Option>
                    <Option value="OTHER">Khác</Option>
                  </Select>
                </Col>

                <Col xs={24} sm={12}>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                    Tỉnh / Thành phố
                  </label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="VD: Hà Nội, TP. Hồ Chí Minh"
                    className="rounded-xl h-11"
                  />
                </Col>

                <Col xs={24} sm={12}>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                    Quận / Huyện
                  </label>
                  <Input
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="VD: Cầu Giấy, Hoàn Kiếm"
                    className="rounded-xl h-11"
                  />
                </Col>

                <Col xs={24} sm={12}>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                    Phường / Xã
                  </label>
                  <Input
                    value={formData.ward}
                    onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                    placeholder="VD: Dịch Vọng Hậu"
                    className="rounded-xl h-11"
                  />
                </Col>

                <Col xs={24}>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                    Địa chỉ chi tiết (Số nhà, đường)
                  </label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="VD: 123 Đường Cầu Giấy"
                    className="rounded-xl h-11"
                  />
                </Col>

                <Col xs={24}>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                    Ảnh đại diện URL
                  </label>
                  <Input
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                    placeholder="https://..."
                    className="rounded-xl h-11"
                  />
                </Col>
              </Row>
            </div>
          )}
        </div>
      </div>

      {/* Verify Email OTP Modal */}
      <Modal
        open={verifyModalVisible}
        onCancel={() => setVerifyModalVisible(false)}
        footer={null}
        centered
        width={420}
        className="rounded-2xl overflow-hidden"
      >
        <div className="p-4 text-center">
          <div className="w-14 h-14 bg-blue-50 text-[#60a5fa] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-blue-100">
            <SafetyCertificateOutlined className="text-2xl" />
          </div>

          <h2 className="text-xl font-black text-gray-900 mb-1">Xác Thực Địa Chỉ Email</h2>
          <p className="text-gray-500 text-xs mb-6">
            Mã OTP 6 chữ số đã được gửi tới hộp thư: <br />
            <strong className="text-gray-800 text-sm">{profile?.email}</strong>
          </p>

          <div className="mb-6">
            <Input
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Nhập 6 số OTP"
              maxLength={6}
              className="text-center text-2xl font-black tracking-widest h-14 rounded-xl border-2 border-blue-200 focus:border-[#60a5fa]"
            />
          </div>

          <div className="flex items-center justify-between mb-6 text-xs">
            <span className="text-gray-400">Không nhận được mã?</span>
            {countdown > 0 ? (
              <span className="text-[#60a5fa] font-bold">Gửi lại sau {countdown}s</span>
            ) : (
              <Button
                type="link"
                size="small"
                loading={sendingOtp}
                onClick={handleSendOtp}
                className="text-[#60a5fa] font-bold p-0 text-xs"
              >
                Gửi lại mã OTP
              </Button>
            )}
          </div>

          <Button
            type="primary"
            block
            loading={verifyingOtp}
            onClick={handleVerifyOtp}
            className="bg-[#60a5fa] hover:bg-blue-500 text-white font-bold h-12 rounded-xl text-sm shadow-md"
          >
            Xác nhận Email
          </Button>
        </div>
      </Modal>
    </div>
  );
}

