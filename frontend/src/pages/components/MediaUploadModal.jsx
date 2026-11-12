import React, { useState, useEffect } from "react";
import {
  Modal,
  Upload,
  Button,
  message,
  Space,
  Tag,
  Card,
  Image,
  Popconfirm,
  Spin,
  Alert,
  Divider,
} from "antd";
import {
  InboxOutlined,
  CameraOutlined,
  UploadOutlined,
  CheckOutlined,
  DeleteOutlined,
  StarFilled,
  CloudUploadOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import {
  uploadMedia,
  getMedias,
  setPrimaryMedia,
  deleteMedia,
} from "../../service/api/mediaApi";

const { Dragger } = Upload;

const OWNER_TYPE_LABELS = {
  SERVICE: { label: "Dịch vụ", color: "blue" },
  STYLIST: { label: "Stylist", color: "purple" },
  SALON: { label: "Chi nhánh Salon", color: "gold" },
  PRODUCT: { label: "Sản phẩm", color: "green" },
  USER: { label: "Người dùng", color: "cyan" },
};

export default function MediaUploadModal({
  open,
  onClose,
  ownerType,
  ownerId,
  ownerName,
  currentImage,
  onSuccess,
}) {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [mediaList, setMediaList] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const isMulti = ownerType === "SALON" || ownerType === "PRODUCT";
  const typeInfo = OWNER_TYPE_LABELS[ownerType] || {
    label: ownerType,
    color: "default",
  };

  const fetchMediaList = async () => {
    if (!ownerType || !ownerId) return;
    setLoadingMedia(true);
    try {
      const data = await getMedias(ownerType, ownerId);
      setMediaList(Array.isArray(data) ? data : []);
    } catch (err) {
      // 404 or empty is normal for new entities
      setMediaList([]);
    } finally {
      setLoadingMedia(false);
    }
  };

  useEffect(() => {
    if (open && ownerId) {
      setFileList([]);
      setPreviewImage(null);
      fetchMediaList();
    }
  }, [open, ownerType, ownerId]);

  const handleBeforeUpload = (file) => {
    const isImage =
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/webp";
    if (!isImage) {
      message.error("Chỉ chấp nhận định dạng ảnh JPG, PNG hoặc WEBP!");
      return Upload.LIST_IGNORE;
    }
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error("Kích thước tệp tin không được vượt quá 10MB!");
      return Upload.LIST_IGNORE;
    }

    setFileList([file]);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewImage(e.target.result);
    reader.readAsDataURL(file);
    return false; // Chặn upload tự động của antd, ta tự gọi API
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning("Vui lòng chọn hoặc kéo thả 1 file ảnh trước!");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadMedia(ownerType, ownerId, fileList[0]);
      message.success("Tải ảnh lên Cloudinary và cập nhật thành công!");
      setFileList([]);
      setPreviewImage(null);
      await fetchMediaList();
      if (onSuccess) {
        onSuccess(result?.secureUrl);
      }
    } catch (err) {
      console.error("Upload error:", err);
      message.error(
        "Upload thất bại: " + (err.response?.data?.message || err.message)
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (mediaId, secureUrl) => {
    try {
      await setPrimaryMedia(ownerType, ownerId, mediaId);
      message.success("Đã chọn làm ảnh chính!");
      await fetchMediaList();
      if (onSuccess) {
        onSuccess(secureUrl);
      }
    } catch (err) {
      message.error(
        "Lỗi khi đặt ảnh chính: " + (err.response?.data?.message || err.message)
      );
    }
  };

  const handleDelete = async (mediaId) => {
    try {
      await deleteMedia(ownerType, ownerId, mediaId);
      message.success("Đã xóa ảnh khỏi Cloudinary và hệ thống!");
      await fetchMediaList();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      message.error(
        "Lỗi khi xóa ảnh: " + (err.response?.data?.message || err.message)
      );
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 pr-6">
          <CameraOutlined className="text-blue-600 text-lg" />
          <span className="font-bold text-gray-800 text-base truncate">
            Đổi ảnh Cloudinary: {ownerName || "Đối tượng"}
          </span>
          <Tag color={typeInfo.color} className="font-medium ml-1">
            {typeInfo.label}
          </Tag>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
      ]}
      width={720}
      destroyOnClose
    >
      <div className="space-y-5 py-2">
        <Alert
          message={
            <span>
              Ảnh tải lên sẽ được lưu trữ và tối ưu hóa CDN trên{" "}
              <strong>Cloudinary</strong>, đồng thời tự động cập nhật liên kết trực
              tiếp vào <strong>{typeInfo.label}</strong>.
            </span>
          }
          type="info"
          showIcon
          icon={<CloudUploadOutlined className="text-blue-500" />}
          className="rounded-xl"
        />

        {/* DRAGGER UPLOAD SECTION */}
        <div className="border border-dashed border-blue-300 rounded-2xl p-4 bg-blue-50/20">
          <Dragger
            accept="image/jpeg,image/png,image/webp"
            beforeUpload={handleBeforeUpload}
            fileList={fileList}
            onRemove={() => {
              setFileList([]);
              setPreviewImage(null);
            }}
            maxCount={1}
            showUploadList={false}
            className="rounded-xl overflow-hidden"
          >
            {previewImage ? (
              <div className="py-2 flex flex-col items-center">
                <img
                  src={previewImage}
                  alt="preview"
                  className="max-h-48 rounded-xl object-contain shadow-sm border border-gray-200"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Tệp đã chọn: <strong>{fileList[0]?.name}</strong> ({(fileList[0]?.size / 1024).toFixed(1)} KB)
                </p>
                <p className="text-xs text-blue-600">Bấm hoặc kéo file khác để thay đổi</p>
              </div>
            ) : (
              <div className="py-4">
                <p className="ant-upload-drag-icon text-blue-500 text-4xl mb-2">
                  <InboxOutlined />
                </p>
                <p className="font-semibold text-gray-700 text-sm mb-1">
                  Kéo thả file ảnh thật vào đây hoặc click để duyệt từ máy tính
                </p>
                <p className="text-xs text-gray-400">
                  Hỗ trợ JPG, PNG, WEBP — Tối đa 10MB
                </p>
              </div>
            )}
          </Dragger>

          {fileList.length > 0 && (
            <div className="flex justify-end gap-2 mt-3">
              <Button
                onClick={() => {
                  setFileList([]);
                  setPreviewImage(null);
                }}
                disabled={uploading}
              >
                Hủy chọn
              </Button>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                loading={uploading}
                onClick={handleUpload}
                className="bg-blue-600 font-semibold"
              >
                {uploading ? "Đang upload lên Cloudinary..." : "Tải lên Cloudinary ngay"}
              </Button>
            </div>
          )}
        </div>

        <Divider className="my-3 text-xs text-gray-400 font-normal">
          <PictureOutlined className="mr-1" /> Thư viện ảnh hiện tại
        </Divider>

        {/* CURRENT MEDIA LIST */}
        {loadingMedia ? (
          <div className="py-8 text-center">
            <Spin tip="Đang tải danh sách ảnh..." />
          </div>
        ) : mediaList.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto p-1">
            {mediaList.map((m) => (
              <Card
                key={m.id}
                hoverable
                className={`rounded-xl overflow-hidden border transition-all ${
                  m.primary ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-200"
                }`}
                bodyStyle={{ padding: "8px" }}
              >
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 mb-2">
                  <img
                    src={m.secureUrl}
                    alt={m.originalFilename || "media"}
                    className="w-full h-full object-cover"
                  />
                  {m.primary && (
                    <div className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1">
                      <StarFilled /> Ảnh chính
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] text-gray-400 truncate max-w-[90px]">
                    {m.format?.toUpperCase()} • {((m.fileSize || 0) / 1024).toFixed(0)} KB
                  </span>
                  <Space size={4}>
                    {!m.primary && (
                      <Button
                        size="small"
                        type="link"
                        className="p-0 text-blue-600 text-xs"
                        onClick={() => handleSetPrimary(m.id, m.secureUrl)}
                      >
                        Đặt chính
                      </Button>
                    )}
                    <Popconfirm
                      title="Xóa ảnh này khỏi Cloudinary?"
                      onConfirm={() => handleDelete(m.id)}
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        size="small"
                        type="text"
                        danger
                        icon={<DeleteOutlined className="text-xs" />}
                      />
                    </Popconfirm>
                  </Space>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4 border border-gray-100">
            {currentImage ? (
              <img
                src={currentImage}
                alt="current"
                className="w-20 h-20 rounded-xl object-cover border border-gray-200 flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gray-200 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
                Chưa có ảnh
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-800 text-sm mb-1">
                {currentImage ? "Đang sử dụng ảnh mặc định / mock" : "Chưa có ảnh nào"}
              </div>
              <p className="text-xs text-gray-500 mb-0 line-clamp-2">
                {currentImage || "Hãy tải ảnh thật lên Cloudinary ở khung bên trên để hiển thị cho đối tượng này."}
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
