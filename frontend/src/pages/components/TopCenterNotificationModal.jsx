import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, X, ChevronRight, AlertTriangle, Info } from 'lucide-react';

/**
 * TopCenterNotificationModal
 * 
 * Đặt chính giữa góc trên cùng màn hình, cố định không bị lệch trái phải.
 * KHÔNG khóa cuộn body (không thêm overflow: hidden) để tránh giật/co giật layout do thanh cuộn 17px trên Windows.
 */
export function TopCenterNotificationModal({
  isOpen,
  type = 'info', // 'success' | 'error' | 'warning' | 'info'
  title,
  message,
  onClose,
  primaryActionText,
  onPrimaryAction,
  autoCloseDuration = 0, // ms, 0 = không tự động đóng
}) {
  useEffect(() => {
    if (!isOpen || !autoCloseDuration) return;
    const timer = setTimeout(() => {
      onClose();
    }, autoCloseDuration);
    return () => clearTimeout(timer);
  }, [isOpen, autoCloseDuration, onClose]);

  if (!isOpen) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';
  const isWarning = type === 'warning';

  const config = {
    success: {
      bg: 'bg-white',
      border: 'border-emerald-200',
      iconBg: 'bg-emerald-100 text-emerald-600',
      icon: <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />,
      defaultTitle: 'Thành công',
      titleColor: 'text-emerald-950',
      primaryBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200',
    },
    error: {
      bg: 'bg-white',
      border: 'border-rose-200',
      iconBg: 'bg-rose-100 text-rose-600',
      icon: <AlertCircle className="w-6 h-6 stroke-[2.5]" />,
      defaultTitle: 'Có lỗi xảy ra',
      titleColor: 'text-rose-950',
      primaryBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200',
    },
    warning: {
      bg: 'bg-white',
      border: 'border-amber-200',
      iconBg: 'bg-amber-100 text-amber-600',
      icon: <AlertTriangle className="w-6 h-6 stroke-[2.5]" />,
      defaultTitle: 'Lưu ý',
      titleColor: 'text-amber-950',
      primaryBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200',
    },
    info: {
      bg: 'bg-white',
      border: 'border-blue-200',
      iconBg: 'bg-blue-100 text-blue-600',
      icon: <Info className="w-6 h-6 stroke-[2.5]" />,
      defaultTitle: 'Thông báo',
      titleColor: 'text-blue-950',
      primaryBtn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200',
    },
  }[type] || config.info;

  const modalContent = (
    <div className="fixed inset-0 z-[99999] pointer-events-none flex justify-center items-start pt-6 sm:pt-8 px-4">
      {/* Light subtle backdrop without blocking body scroll */}
      <div
        className="fixed inset-0 bg-black/20 pointer-events-auto transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Floating Modal Box placed top-center */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative pointer-events-auto w-full max-w-md ${config.bg} rounded-2xl border-2 ${config.border} shadow-2xl p-5 transform transition-all duration-300 ease-out translate-y-0 scale-100 animate-in fade-in slide-in-from-top-4`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          {/* Status Icon */}
          <div className={`w-11 h-11 rounded-xl ${config.iconBg} flex items-center justify-center shrink-0 shadow-sm mt-0.5`}>
            {config.icon}
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0 pr-6">
            <h4 className={`text-base font-extrabold ${config.titleColor} mb-1 leading-tight`}>
              {title || config.defaultTitle}
            </h4>
            <p className="text-sm text-gray-600 font-medium leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-xl transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Đóng
          </button>

          {primaryActionText && onPrimaryAction && (
            <button
              type="button"
              onClick={() => {
                onPrimaryAction();
                onClose();
              }}
              className={`px-4 py-2 text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 ${config.primaryBtn}`}
            >
              {primaryActionText}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

