import React from "react";
import { Card, Avatar, Tag } from "antd";
import { UserOutlined } from "@ant-design/icons";

export default function StylistProfile({ profile, userInfo, formatCurrency }) {
  return (
    <div className="max-w-4xl space-y-6">
      <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-gray-100">
          <Avatar
            size={96}
            src={profile?.avatarUrl || userInfo?.avatarUrl}
            icon={<UserOutlined />}
            className="border-4 border-amber-500 shadow-lg"
          />
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
            <p className="font-bold text-sm text-amber-600 mb-0">⭐ {Number(profile?.ratingAverage || 4.9).toFixed(1)} / 5.0</p>
            <span className="text-[11px] text-gray-500">{profile?.totalServedBookings || 1000}+ khách hàng hài lòng</span>
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
