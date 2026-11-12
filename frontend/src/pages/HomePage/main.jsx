import React from 'react';
import Footer from '../components/Footer';
import LayoutHeader from '../components/LayoutHeader';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/authProvider';

export default function HomePage() {
  const { openLoginModal, authenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white text-slate-900 overflow-x-clip">
      <LayoutHeader
        onLoginClick={() => openLoginModal()}
        isLoggedIn={authenticated}
      />

      <main className="flex-1 pt-16 md:pt-[108px] overflow-x-clip">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}