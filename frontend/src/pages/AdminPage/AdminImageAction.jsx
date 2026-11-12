import React, { useState, useEffect } from "react";
import { Dropdown, Image } from "antd";
import { EyeOutlined, CameraOutlined } from "@ant-design/icons";

/**
 * Reusable Circular Image with Dropdown Actions (Xem ảnh / Sửa ảnh)
 * Replaces standalone "Sửa ảnh" buttons across the Admin panel.
 */
export default function AdminImageAction({
  src,
  alt = "Ảnh",
  size = 48,
  onEdit,
  fallback = "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200",
  className = "",
  title = "Bấm để xem hoặc sửa ảnh",
}) {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src || fallback);

  useEffect(() => {
    setCurrentSrc(src || fallback);
  }, [src, fallback]);

  const menuItems = [
    {
      key: "view",
      label: <span className="font-medium text-xs text-slate-800">Xem ảnh</span>,
      icon: <EyeOutlined className="text-[#0099FF] text-sm" />,
      onClick: () => setPreviewVisible(true),
    },
    ...(onEdit
      ? [
          {
            key: "edit",
            label: <span className="font-medium text-xs text-slate-800">Sửa ảnh</span>,
            icon: <CameraOutlined className="text-emerald-600 text-sm" />,
            onClick: () => onEdit(),
          },
        ]
      : []),
  ];

  return (
    <>
      <Dropdown
        menu={{ items: menuItems }}
        trigger={["click"]}
        placement="bottomLeft"
      >
        <div
          role="button"
          tabIndex={0}
          title={title}
          style={{ width: size, height: size }}
          className={`relative rounded-full aspect-square overflow-hidden cursor-pointer shrink-0 border-2 border-slate-200/90 hover:border-[#0099FF] shadow-xs hover:shadow-md transition-all group select-none bg-slate-100 ${className}`}
        >
          <img
            src={currentSrc}
            alt={alt}
            onError={() => setCurrentSrc(fallback)}
            className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
          {/* Subtle hover icon hint */}
          <div className="absolute inset-0 rounded-full bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs pointer-events-none">
            <CameraOutlined />
          </div>
        </div>
      </Dropdown>

      {/* Hidden Image for Ant Design Lightbox */}
      <div style={{ display: "none" }}>
        <Image
          preview={{
            visible: previewVisible,
            src: currentSrc,
            onVisibleChange: (vis) => setPreviewVisible(vis),
          }}
        />
      </div>
    </>
  );
}
