import React, { useState } from 'react';
import {
  Input,
  Button,
  Modal,
  Form
} from 'antd';

const RegisterPage = ({visible, onClose, onLogin}) => {
  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={720}
      centered
      className="rounded-xl overflow-hidden"
    >
      <div className="pt-6 pb-2 px-2 text-center">
        <h2 className="text-2xl font-black text-[#1b2a4a] mb-2">ĐĂNG KÝ TÀI KHOẢN</h2>
        <p className="text-gray-500 text-sm mb-6">Điền thông tin để trở thành thành viên 30Shine</p>

        <Form layout="vertical">
          <Form.Item name="fullname" rules={[{ required: true, message: 'Vui lòng nhập Họ và tên!' }]}>
            <Input size="large" placeholder="Họ và tên" className="rounded-md" />
          </Form.Item>

          <Form.Item name="username" rules={[{ required: true, message: 'Vui lòng nhập Tên đăng nhập!' }]}>
            <Input size="large" placeholder="Tên đăng nhập (Username)" className="rounded-md" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="phone" rules={[{ required: true, message: 'Vui lòng nhập Số điện thoại!' }]}>
              <Input size="large" placeholder="Số điện thoại" className="rounded-md" />
            </Form.Item>
            <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ!' }]}>
              <Input size="large" placeholder="Email" className="rounded-md" />
            </Form.Item>
          </div>

          <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập Mật khẩu!' }]}>
            <Input.Password size="large" placeholder="Mật khẩu" className="rounded-md" />
          </Form.Item>

          <Button type="primary" size="large" className="w-full bg-[#1b2a4a] hover:bg-[#244383] h-12 text-base font-bold mb-4 mt-2">
            ĐĂNG KÝ
          </Button>

          <div className="mt-4 text-sm text-gray-600">
            Đã có tài khoản?{' '}
            <span
                className = "text-blue-600 font-bold hover:underline cursor-pointer"
                onClick = {onLogin}
            >
              Đăng nhập
            </span>
          </div>
        </Form>
      </div>
    </Modal>

  );
};

export default RegisterPage;
