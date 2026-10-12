import React, { useState, useRef } from "react";
import { Card, Avatar, Tag, Button, message, Spin, Tooltip } from "antd";
import { UserOutlined, CameraOutlined, UploadOutlined, LoadingOutlined } from "@ant-design/icons";
import { uploadStylistAvatar } from "../../../service/api/adminApi";
import { useAuth } from "../../../auth/authProvider";

export default function StylistProfile({ profile, userInfo, formatCurrency, onAvatarUpdated }) {
  const { checkCurrentSession } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const stylistId = profile?.id || userInfo?.id;
  const currentAvatar = profile?.avatarUrl || userInfo?.avatarUrl;

  const handleAvatarClick = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      message.error("Vui lòng chọn định dạng file hình ảnh (JPG, PNG, WEBP)!");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      message.error("Kích thước ảnh tối đa là 10MB!");
      return;
    }

    try {
      setUploading(true);
      const res = await uploadStylistAvatar(stylistId, file);
      const newAvatarUrl = res.avatarUrl;

      message.success("Cập nhật ảnh đại diện Stylist thành công!");
      if (onAvatarUpdated) {
        onAvatarUpdated(newAvatarUrl);
      }
      if (checkCurrentSession) {
        await checkCurrentSession();
      }
    } catch (err) {
      console.error("Lỗi khi tải ảnh đại diện stylist:", err);
      message.error(err?.response?.data?.message || "Tải ảnh đại diện thất bại. Vui lòng thử lại!");
    } finally {
      setUploading(false);
      // Reset input value để cho phép chọn lại cùng 1 file nếu muốn
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-gray-100">
          {/* Avatar Area with Upload Trigger */}
          <div className="relative group cursor-pointer flex flex-col items-center">
            <div className="relative" onClick={handleAvatarClick}>
              <Avatar
                size={100}
                src={currentAvatar}
                icon={<UserOutlined />}
                className="border-4 border-amber-500 shadow-lg transition-transform duration-200 group-hover:scale-105"
              />
              {uploading ? (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <Spin indicator={<LoadingOutlined style={{ fontSize: 28, color: "#fff" }} spin />} />
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-medium">
                  <CameraOutlined className="text-xl mb-1" />
                  <span>Đổi ảnh</span>
                </div>
              )}
              <Tooltip title="Chọn ảnh từ máy tính hoặc điện thoại">
                <button
                  type="button"
                  aria-label="Cập nhật ảnh đại diện"
                  disabled={uploading}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAvatarClick();
                  }}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md hover:bg-amber-600 transition-colors border-2 border-white cursor-pointer"
                >
                  <CameraOutlined className="text-sm" />
                </button>
              </Tooltip>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <Button
              type="link"
              size="small"
              icon={<UploadOutlined />}
              loading={uploading}
              onClick={handleAvatarClick}
              className="mt-2 text-xs text-amber-600 font-medium hover:text-amber-700 p-0 h-auto"
            >
              {uploading ? "Đang tải ảnh..." : "Tải ảnh từ thiết bị"}
            </Button>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h2 className="text-2xl font-black text-gray-900 mb-0">
                {profile?.fullName || userInfo?.fullName}
              </h2>
              <Tag color="gold" className="font-bold text-xs uppercase self-center sm:self-auto">
                {profile?.levelRank || "MASTER"} STYLIST
              </Tag>
            </div>
            <p className="text-sm text-amber-600 font-semibold mb-2">@{profile?.nickname || "alex"}</p>
            <p className="text-xs text-gray-600 italic max-w-xl">
              "{profile?.bio || "Stylist chuyên nghiệp tận tâm với từng đường nét phong cách của quý khách."}"
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-6 text-xs text-gray-700">
          <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 space-y-1">
            <span className="text-gray-400">Chi nhánh công tác</span>
            <p className="font-bold text-sm text-gray-800 mb-0">📍 {profile?.salonName || "Chi nhánh Cầu Giấy"}</p>
            <span className="text-[11px] text-gray-500">{profile?.salonAddress}</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 space-y-1">
            <span className="text-gray-400">Kinh nghiệm chuyên môn</span>
            <p className="font-bold text-sm text-blue-700 mb-0">{profile?.experienceYears || 5} năm kinh nghiệm</p>
            <span className="text-[11px] text-gray-500">Gia nhập: {profile?.joinDate || "2020-01-01"}</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 space-y-1">
            <span className="text-gray-400">Hiệu suất phục vụ</span>
            <p className="font-bold text-sm text-amber-600 mb-0">
              ⭐ {profile?.totalReviewsCount > 0 ? `${Number(profile?.ratingAverage).toFixed(1)} / 5.0` : "Chưa có đánh giá"}
            </p>
            <span className="text-[11px] text-gray-500">
              {profile?.totalReviewsCount > 0 ? `${profile.totalReviewsCount} đánh giá từ khách hàng` : "Chưa nhận đánh giá nào"}
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 space-y-1">
            <span className="text-gray-400">Lương cơ bản</span>
            <p className="font-bold text-sm text-gray-800 mb-0">{formatCurrency(profile?.baseSalary || 12000000)}</p>
            <span className="text-[11px] text-gray-500">Được chi trả đúng kỳ hạn</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 space-y-1">
            <span className="text-gray-400">Tỉ lệ hoa hồng</span>
            <p className="font-bold text-sm text-green-600 mb-0">+{profile?.commissionRate || 20}% mỗi dịch vụ</p>
            <span className="text-[11px] text-gray-500">Tiền tip tích lũy: {formatCurrency(profile?.tipBalance || 500000)}</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 space-y-1">
            <span className="text-gray-400">Ca làm việc</span>
            <p className="font-bold text-sm text-purple-700 mb-0">{profile?.workShiftType || "FULL_TIME"}</p>
            <span className="text-[11px] text-gray-500">Được bảo hiểm & quyền lợi đầy đủ</span>
          </div>
        </div>

        {profile?.specialties && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-500 font-semibold block mb-2">Thế mạnh & Phong cách sở trường:</span>
            <div className="flex flex-wrap gap-2">
              {profile.specialties.split(",").map((tag, idx) => (
                <Tag key={idx} color="purple" className="text-xs font-semibold py-0.5 px-2.5 rounded-lg">
                  ✨ {tag.trim()}
                </Tag>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
