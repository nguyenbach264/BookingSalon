import { useEffect } from "react";

import notificationWebSocket from "../service/websocket/notificationWebSocket.js";
import { WS_REVIEW_URL } from "../config/api.js";

const useNotificationWebSocket = (productId, onNewReview) => {
  useEffect(() => {
    if (!productId) return;

    notificationWebSocket.connect(WS_REVIEW_URL, (message) => {
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