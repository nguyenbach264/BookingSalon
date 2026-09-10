import React, { useState, useEffect } from 'react';
import Footer from '../components/Footer';
import RegisterPage from '../ShopPage/RegisterPage';
import LayoutHeader from '../components/LayoutHeader';
import LoginPage from '../ShopPage/LoginPage';
import { Outlet } from 'react-router-dom';

export default function HomePage() {
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); 

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50 text-gray-900">
      <LayoutHeader
        onLoginClick={() => {
          setIsRegisterModalVisible(false);
          setIsLoginModalVisible(true);
        }}
        isLoggedIn={isLoggedIn}
      ></LayoutHeader>

      <LoginPage
        visible={isLoginModalVisible}
        onClose={() => setIsLoginModalVisible(false)}
        onGoToRegister={() => {
          setIsLoginModalVisible(false);
          setIsRegisterModalVisible(true);
        }}
        onLoggedIn={() => {
          setIsLoggedIn(true)
          setIsLoginModalVisible(false)
        }}
      />

      <RegisterPage
        visible={isRegisterModalVisible}
        onClose={() => setIsRegisterModalVisible(false)}
        onLogin={() => {
          setIsRegisterModalVisible(false);
          setIsLoginModalVisible(true);
        }}
      />

      <main className="flex-1 pt-[108px]">
        <Outlet />
      </main>

      <Footer></Footer>
    </div>
  );
}