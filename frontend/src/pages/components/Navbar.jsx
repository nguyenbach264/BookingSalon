const Navbar = () => {
  return (
    <nav
      className={`fixed left-0 z-[100] w-[100%] bg-blue-400 transition-[top] duration-300 ease-in-out `}
    >
      <div className="max-w-[1280px] mx-auto px-4 flex justify-between items-stretch gap-6 overflow-x-auto text-gray-100 text-sm font-semibold tracking-wide scrollbar-hide">
        <a href="/service" className="px-2 py-3 hover:bg-blue-500 uppercase whitespace-nowrap" >
          DỊCH VỤ
        </a>

        <a href="/shop" className="px-2 py-3 hover:bg-blue-500 uppercase whitespace-nowrap" >
          CỬA HÀNG
        </a>

        <a href="#" className="px-2 py-3 hover:bg-blue-500 uppercase whitespace-nowrap" >
          TẤT CẢ
        </a>
        <a href="#" className="px-2 py-3 hover:bg-blue-500 uppercase whitespace-nowrap" >
          SẢN PHẨM MỚI  
        </a>

        <a href="#" className="px-2 py-3 hover:bg-blue-500 uppercase whitespace-nowrap" >
          THƯƠNG HIỆU
        </a>

        <a href="#" className="px-2 py-3 hover:bg-blue-500 uppercase whitespace-nowrap" >
          GIỚI THIỆU
        </a>
      </div>

    </nav>
  )
};

export default Navbar;
