import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./pages/Routes/AppRoutes";
import AuthAxiosInjector from "./service/api/AuthAxiosInjector";

function App() {
  return (
    <>
      <AuthAxiosInjector />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </>
  );
}

export default App;
