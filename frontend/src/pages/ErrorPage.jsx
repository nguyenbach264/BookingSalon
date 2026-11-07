import React from 'react';
import { useRouteError, useNavigate } from 'react-router-dom';
import { HomeOutlined, ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';

export default function ErrorPage({ customError, onReset }) {
  let routerError = null;
  try {
    routerError = useRouteError();
  } catch {
    routerError = null;
  }

  let navigate = null;
  try {
    navigate = useNavigate();
  } catch {
    navigate = null;
  }

  const error = customError || routerError;
  const status = error?.status || error?.statusCode || 404;
  const errorMessage = error?.statusText || error?.message;
  const is404 = status === 404;

  const handleGoHome = () => {
    if (onReset) onReset();
    if (navigate) navigate('/');
    else window.location.href = '/';
  };

  const handleGoBack = () => {
    if (navigate && window.history.length > 1) {
      navigate(-1);
    } else {
      handleGoHome();
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#dceef5] flex flex-col items-center justify-center p-4 sm:p-6 select-none font-sans">
      <div className="max-w-lg w-full flex flex-col items-center text-center">
        {/* Main Illustration matching user's image */}
        <div className="relative w-full max-w-[340px] sm:max-w-[400px] mb-5 flex justify-center">
          <img
            src="/error-404.png"
            alt="Sorry - Page Not Found"
            className="w-full h-auto object-contain drop-shadow-md rounded-2xl"
          />
        </div>

        {/* Error message if not 404 or specific message passed */}
        {!is404 && errorMessage && (
          <div className="mb-4 px-4 py-2 bg-white/80 backdrop-blur-xs rounded-xl border border-red-200 text-xs text-red-600 font-mono max-w-md">
            Mã lỗi ({status}): {String(errorMessage)}
          </div>
        )}

        <p className="text-gray-600 text-sm sm:text-base font-medium mb-6 max-w-sm">
          {is404
            ? 'Đường dẫn bạn yêu cầu không tồn tại hoặc đã được chuyển sang địa chỉ khác.'
            : 'Đã xảy ra sự cố không mong muốn trong quá trình xử lý.'}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleGoBack}
            className="px-5 py-2.5 rounded-full bg-white hover:bg-gray-100 text-gray-700 font-bold text-sm shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer border border-gray-200"
          >
            <ArrowLeftOutlined /> Quay lại
          </button>

          <button
            onClick={handleGoHome}
            className="px-6 py-2.5 rounded-full bg-[#2c4f56] hover:bg-[#233e44] text-white font-bold text-sm shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <HomeOutlined /> Về trang chủ
          </button>

          {!is404 && (
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <ReloadOutlined /> Thử lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
