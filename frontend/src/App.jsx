import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import AppRoutes from "./routes/AppRoutes";
import AuthAxiosInjector from "./services/api/AuthAxiosInjector";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";
import PageTitleManager from "./components/PageTitleManager";
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
