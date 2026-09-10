import { createContext, useContext, useEffect, useState } from "react";
import api from "../service/api/axiosApi";

import keycloak from "./keycloak";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null); 

  useEffect(() => {
    const init = async () => {
      try {
        const authenticated = await keycloak.init({
          onLoad: "check-sso",
          pkceMethod: "S256",
          checkLoginIframe: false
        });

        if (authenticated) {
          setUserInfo({
            userId: keycloak.tokenParsed.sub, 
            username: keycloak.tokenParsed.name, 
            email: keycloak.tokenParsed.email, 
            role: keycloak.tokenParsed.realm_access.roles,
          })

          const userResponse = await api.get(`users/user/${keycloak.tokenParsed.sub}`); 
          console.log("User info fetched successfully:", userResponse.data);
          setUserInfo(userResponse.data);
        }

        console.log("Authenticated:", authenticated);
        console.log("Access Token:", keycloak.token);
        console.log("Refresh Token:", keycloak.refreshToken);
        console.log("ID Token:", keycloak.idToken);
        console.log("Token Parsed:", keycloak.tokenParsed);
        console.log("UID:", keycloak.tokenParsed.sub);

        setAuthenticated(authenticated);
      } catch (error) {
        console.error("Keycloak initialization failed:", error);
      } finally {
        setInitialized(true);
      }
    };
    init();
  }, []);

  const login = () => { console.log("🔥 LOGIN FUNCTION CALLED"); keycloak.login(); };

  const logout = async () => { 
    try {
      setAuthenticated(false);  
      setUserInfo(null);
      await keycloak.logout({ redirectUri: window.location.origin }); 
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        keycloak,
        initialized,
        authenticated,
        userInfo,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}