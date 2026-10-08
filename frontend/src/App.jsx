import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import AppRoutes from "./pages/Routes/AppRoutes";
import AuthAxiosInjector from "./service/api/AuthAxiosInjector";
import ScrollToTop from "./pages/components/ScrollToTop";

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          colorPrimary: "#60a5fa",
        },
      }}
    >
      <AuthAxiosInjector />
      <BrowserRouter>
        <ScrollToTop />
        <AppRoutes />
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
