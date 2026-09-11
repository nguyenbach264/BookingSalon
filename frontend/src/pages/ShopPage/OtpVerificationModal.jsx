import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Alert } from "antd";
import { useAuth } from "../../auth/authProvider";

const OtpVerificationModal = ({
  visible,
  onClose,
  email,
  registrationData,
  onSuccess,
}) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRefs = useRef([]);

  const { verifyOtpAndRegister, sendRegisterOtp, loading } = useAuth();

  // Reset state va khoi tao timer khi modal bat len
  useEffect(() => {
    if (visible) {
      setOtp(["", "", "", "", "", ""]);
      setCountdown(60);
      setErrorMsg("");
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 100);
    }
  }, [visible]);

  // Bo dem nguoc 60 giay cho nut gui lai ma
  useEffect(() => {
    if (!visible || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, countdown]);

  // Xu ly thay doi o tung o nhap so
  const handleChange = (index, value) => {
    // Chi chap nhan ky tu so
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setErrorMsg("");

    // Tu dong chuyen con tro sang o tiep theo neu da nhap
    if (digit && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }

    // Neu da nhap du 6 so, tu dong submit
    if (digit && index === 5 && newOtp.every((d) => d !== "")) {
      handleVerify(newOtp.join(""));
    }
  };

  // Xu ly Backspace va phim dieu huong
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0 && inputRefs.current[index - 1]) {
        // Neu o hien tai dang rong, quay ve o truoc va xoa
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1].focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Ho tro Dan (Paste Ctrl+V) ca chuoi 6 so
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    setErrorMsg("");

    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();

    if (pastedData.length === 6) {
      handleVerify(pastedData);
    }
  };

  // Gui ma OTP xac thuc
  const handleVerify = async (otpCode) => {
    const code = otpCode || otp.join("");
    if (code.length < 6) {
      setErrorMsg("Vui lòng nhập đủ 6 chữ số mã OTP!");
      return;
    }

    setErrorMsg("");
    const result = await verifyOtpAndRegister({
      ...registrationData,
      otp: code,
    });

    if (result.success) {
      if (onSuccess) onSuccess(result.user);
    } else {
      setErrorMsg(result.error || "Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại!");
    }
  };

  // Gui lai ma OTP
  const handleResend = async () => {
    if (countdown > 0 || resending) return;

    setResending(true);
    setErrorMsg("");
    try {
      const res = await sendRegisterOtp({
        email: registrationData.email,
        username: registrationData.username,
        phoneNumber: registrationData.phoneNumber,
      });

      if (res.success) {
        setCountdown(60);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setErrorMsg(res.error || "Không thể gửi lại mã OTP lúc này!");
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      width={520}
      className="rounded-2xl overflow-hidden"
      destroyOnClose
    >
      <div className="p-6 text-center">
        {/* Icon & Title */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center text-[#1b2a4a]">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h2 className="text-2xl font-black text-[#1b2a4a] mb-2 tracking-wide">XÁC THỰC EMAIL</h2>
        <p className="text-sm text-gray-600 mb-1">
          Mã xác thực 6 chữ số đã được gửi tới địa chỉ:
        </p>
        <p className="text-base font-bold text-[#1b2a4a] mb-6 bg-gray-50 py-1.5 px-3 rounded-lg inline-block">
          {email}
        </p>

        {errorMsg && (
          <Alert message={errorMsg} type="error" showIcon className="mb-5 text-left rounded-lg" />
        )}

        {/* 6 o nhap so OTP */}
        <div className="flex justify-center gap-2.5 sm:gap-3 mb-6" onPaste={handlePaste}>
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-11 h-14 sm:w-12 sm:h-16 text-center text-2xl font-black rounded-xl border-2 border-gray-300 text-[#1b2a4a] focus:border-[#1b2a4a] focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-sm"
            />
          ))}
        </div>

        {/* Nut Xac nhan */}
        <Button
          type="primary"
          onClick={() => handleVerify()}
          loading={loading}
          className="w-full h-12 bg-[#1b2a4a] hover:bg-[#244383] font-bold text-base rounded-xl mb-4"
        >
          XÁC NHẬN & ĐĂNG KÝ
        </Button>

        {/* Nut Gui lai ma kem Cooldown 60s */}
        <div className="text-sm text-gray-600 mb-2">
          Không nhận được mã?{" "}
          {countdown > 0 ? (
            <span className="text-gray-400 font-semibold cursor-not-allowed">
              Gửi lại sau ({countdown}s)
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-blue-600 font-bold hover:underline cursor-pointer bg-transparent border-none p-0 inline"
            >
              {resending ? "Đang gửi lại..." : "Gửi lại mã OTP"}
            </button>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100">
          <span
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-gray-800 cursor-pointer"
          >
            ← Quay lại chỉnh sửa thông tin đăng ký
          </span>
        </div>
      </div>
    </Modal>
  );
};

export default OtpVerificationModal;