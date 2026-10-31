import React, { useEffect, useRef, useState } from "react";
import ShopHeader from "./ShopHeader"; 
import Navbar from "./Navbar";

const ShopLayoutHeader = ({
  onLoginClick,
  onRegisterClick,
  onCartClick,
  cartCount,
}) => {
  const [showHeader, setShowHeader] = useState(true);

  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      if (ticking.current) return;

      ticking.current = true;

      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const diff = currentScrollY - lastScrollY.current;

        // Ở đầu trang -> luôn hiện đầy đủ Header
        if (currentScrollY <= 20) {
          setShowHeader(true);
        }
        // Scroll đủ lớn mới xử lý
        else if (Math.abs(diff) >= 10) {
          // Scroll xuống -> ẩn Header, Navbar dính lên top (top-0)
          // Scroll xuống -> ẩn Header, Navbar dính lên top
          if (diff > 0) {
            setShowHeader(false);
          }
          // Scroll lên -> hiện lại Header, Navbar về vị trí dưới Header (top-16)
          // Scroll lên -> hiện lại Header
          else {
            setShowHeader(true);
          }

          lastScrollY.current = currentScrollY;
        }

        ticking.current = false;
      });
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      className={`fixed top-0 left-0 z-[110] w-full transition-transform duration-300 ease-in-out ${
        showHeader ? "translate-y-0" : "-translate-y-16"
      }`}
    >
      <ShopHeader
        onLoginClick={onLoginClick}
        onRegisterClick={onRegisterClick}
        onCartClick={onCartClick}
        cartCount={cartCount}
      />
      <Navbar />
    </div>
  );
};

export default ShopLayoutHeader;
