import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Provider } from "react-redux";
import { store } from './redux/store.js';
import { NotificationProvider } from './service/context/NotificationContext.jsx';
import { AuthProvider } from './auth/authProvider.jsx';
import { BookingProvider } from './service/context/BookingContext.jsx';
import { applyThemeToDocument } from './config/theme.js';

// Đồng bộ màu sắc chủ đạo và font chữ ngay từ khi khởi động ứng dụng
applyThemeToDocument();

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <AuthProvider>
      <NotificationProvider>
        <BookingProvider>
          <App />
        </BookingProvider>
      </NotificationProvider>
    </AuthProvider>
  </Provider>
)
