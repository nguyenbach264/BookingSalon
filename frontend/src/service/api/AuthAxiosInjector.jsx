import { useEffect } from "react";
import { useAuth } from "../../auth/authProvider";
import { injectAuthContext } from "./axiosApi";

/**
 * AuthAxiosInjector
 * Component này phải được render bên trong <AuthProvider>.
 * Nó inject AuthContext vào axiosApi một lần duy nhất khi mount,
 * giải quyết circular dependency giữa authProvider ↔ axiosApi.
 */
export default function AuthAxiosInjector() {
  const auth = useAuth();

  useEffect(() => {
    injectAuthContext(auth);
  }, [auth]);

  return null; // Không render gì cả
}

