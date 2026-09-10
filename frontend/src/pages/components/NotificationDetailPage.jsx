import { useNotification } from "../../service/context/NotificationContext";
import { Breadcrumb } from 'antd';
import { ShoppingCart, ChevronLeft, Bell, CalendarCheck, } from 'lucide-react'

const NotificationDetailPage = ({ onGoBack }) => {
  const { selectedNotification } = useNotification();

  const notification = selectedNotification;

  if (!notification) return null;

  return (
    <div className="w-full flex-1 bg-gray-50 flex flex-col pb-16">
      <div className="w-full bg-white py-3 border-b border-gray-200">
        <div className="max-w-[1280px] mx-auto px-4">
          <Breadcrumb
            items={[
              { title: <span className="text-gray-500 cursor-pointer hover:text-blue-600 transition-colors" onClick={onGoBack}>Trang chủ</span> },
              { title: <span className="text-gray-900 font-medium">Chi tiết thông báo</span> }
            ]}
          />
        </div>
      </div>
      <div className="max-w-[1280px] mx-auto px-4 py-8 w-full flex-1">
        <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-6">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
              {notification.type === 'order' && <ShoppingCart className="w-6 h-6" />}
              {notification.type === 'service' && <CalendarCheck className="w-6 h-6" />}
              {notification.type === 'promo' && <Bell className="w-6 h-6" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-1">{notification.title}</h1>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {notification.time}
              </span>
            </div>
          </div>
          <div className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap min-h-[120px]">
            {notification.description}
          </div>
          <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end">
            <button
              onClick={onGoBack}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Quay lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDetailPage; 