import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import AppRoutes from "./pages/Routes/AppRoutes";
import AuthAxiosInjector from "./service/api/AuthAxiosInjector";
import ScrollToTop from "./pages/components/ScrollToTop";
import ErrorBoundary from "./pages/components/ErrorBoundary";
import PageTitleManager from "./pages/components/PageTitleManager";

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
