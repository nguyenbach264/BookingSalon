import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import AppRoutes from "./pages/Routes/AppRoutes";
import AuthAxiosInjector from "./service/api/AuthAxiosInjector";
import ScrollToTop from "./pages/components/ScrollToTop";
import ErrorBoundary from "./pages/components/ErrorBoundary";
import PageTitleManager from "./pages/components/PageTitleManager";
import { THEME_CONFIG } from "./config/theme";

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: THEME_CONFIG.fontFamily,
          colorPrimary: THEME_CONFIG.primaryColor,
        },
      }}
    >
      <AuthAxiosInjector />
      <BrowserRouter>
        <ErrorBoundary>
          <PageTitleManager />
          <ScrollToTop />
          <AppRoutes />
        </ErrorBoundary>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
