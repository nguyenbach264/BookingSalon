import { useEffect } from "react";

import notificationWebSocket from "../service/websocket/notificationWebSocket.js";

const useNotificationWebSocket = (productId, onNewReview) => {
  useEffect(() => {
    if (!productId) return;

    notificationWebSocket.connect("ws://localhost:8080/ws/reviews", (message) => {
      if (message.type === "NEW_REVIEW" && message.data.productId === productId) {
        onNewReview(message.data);
      }
    });

    return () => {
      notificationWebSocket.disconnect();
    };

  }, [productId, onNewReview]);
};

export default useNotificationWebSocket;