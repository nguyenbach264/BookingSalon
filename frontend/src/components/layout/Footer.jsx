import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, MapPin, Mail, Scissors, ShieldCheck, Heart, Clock } from 'lucide-react';

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer 
      className="w-full bg-[#0099FF] text-white pt-12 pb-8 border-t border-white/20 transition-colors shadow-inner"
      style={{ backgroundColor: 'var(--primary-color, #0099FF)' }}
    >
      <div className="max-w-[1280px] mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Col 1: Brand Info */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-4 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 rounded-xl bg-white text-[#0099FF] flex items-center justify-center font-bold shadow-xs" style={{ color: 'var(--primary-color, #0099FF)' }}>
              <Scissors size={20} className="rotate-45" />
            </div>
            <span className="text-2xl font-black italic tracking-wider text-white">BachBarber</span>
          </div>
          <p className="text-xs text-white/90 leading-relaxed mb-3">
            Hệ thống Salon & Barber chuyên nghiệp hàng đầu. Định hình phong cách và chăm sóc toàn diện cho quý ông hiện đại.
          </p>
          <div className="text-[11px] text-white/80 space-y-1">
            <p>Số ĐKKD: 010.889.921 - Cấp ngày 15/08/2019</p>
            <p>Nơi cấp: Sở Kế hoạch & Đầu tư TP. Hà Nội</p>
          </div>
          <div className="mt-4">
            <span className="bg-white/20 border border-white/30 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block">
              ✓ ĐÃ ĐĂNG KÝ BỘ CÔNG THƯƠNG
            </span>
          </div>
        </div>

        {/* Col 2: Quick Links */}
        <div>
          <h4 className="font-bold text-sm uppercase tracking-wider text-white mb-4 pb-1 border-b border-white/20">
            Khám Phá
          </h4>
          <ul className="space-y-2.5 text-xs text-white/90 font-medium">
            <li className="hover:text-white hover:underline cursor-pointer transition" onClick={() => navigate('/service')}>
              Dịch vụ Salon & Bảng giá
            </li>
            <li className="hover:text-white hover:underline cursor-pointer transition" onClick={() => navigate('/shop')}>
              Cửa hàng sáp & mỹ phẩm
            </li>
            <li className="hover:text-white hover:underline cursor-pointer transition" onClick={() => navigate('/salons')}>
              Hệ thống 12 chi nhánh
            </li>
            <li className="hover:text-white hover:underline cursor-pointer transition" onClick={() => navigate('/promotions')}>
              Mã giảm giá & Voucher hot
            </li>
            <li className="hover:text-white hover:underline cursor-pointer transition" onClick={() => navigate('/about')}>
              Về chúng tôi & Stylist
            </li>
          </ul>
        </div>

        {/* Col 3: Policies & Support */}
        <div>
          <h4 className="font-bold text-sm uppercase tracking-wider text-white mb-4 pb-1 border-b border-white/20">
            Chính Sách & Hỗ Trợ
          </h4>
          <ul className="space-y-2.5 text-xs text-white/90 font-medium">
            <li className="hover:text-white hover:underline cursor-pointer transition">Chính sách bảo hành tóc 7 ngày</li>
            <li className="hover:text-white hover:underline cursor-pointer transition">Chính sách đổi trả sản phẩm</li>
            <li className="hover:text-white hover:underline cursor-pointer transition">Bảo mật thông tin khách hàng</li>
            <li className="hover:text-white hover:underline cursor-pointer transition">Điều khoản đặt hẹn & hủy lịch</li>
            <li className="hover:text-white hover:underline cursor-pointer transition">Hướng dẫn thanh toán VietQR</li>
          </ul>
        </div>

        {/* Col 4: Contact & Hotlines */}
        <div>
          <h4 className="font-bold text-sm uppercase tracking-wider text-white mb-4 pb-1 border-b border-white/20">
            Tổng Đài Phục Vụ
          </h4>
          <div className="space-y-3">
            <a 
              href="tel:0961891914"
              className="w-full bg-white text-[#0099FF] py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all font-bold text-sm shadow-md"
              style={{ color: 'var(--primary-color, #0099FF)' }}
            >
              <Phone size={16} />
              <span>HOTLINE: 096.189.1914</span>
            </a>
            <div className="text-xs text-white/90 space-y-1.5 pt-1">
              <p className="flex items-center gap-1.5">
                <Clock size={13} className="text-white/80" />
                <span>Phục vụ: 08:30 - 21:30 hàng ngày</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Mail size={13} className="text-white/80" />
                <span>contact@bachbarber.vn</span>
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Copyright Bar */}
      <div className="max-w-[1280px] mx-auto px-4 mt-10 pt-6 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between text-xs text-white/80 gap-3">
        <p>© 2026 BachBarber Premium Salon. Tất cả các quyền được bảo lưu.</p>
        <p className="flex items-center gap-1 text-[11px]">
          Thiết kế chuẩn mực cho trải nghiệm khách hàng đẳng cấp
        </p>
      </div>
    </footer>
  );
};

export default Footer;
