import { createContext, useContext, useState } from "react";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [selectedNotification, setSelectedNotification] = useState(null);

  return (
    <NotificationContext.Provider
      value={{
        selectedNotification,
        setSelectedNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  return useContext(NotificationContext);
};
