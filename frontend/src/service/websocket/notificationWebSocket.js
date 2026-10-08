class NotificationWebSocket {
  socket = null;
  listeners = new Set();
  reconnectTimer = null;
  pingTimer = null;
  isConnected = false;
  options = { userId: null, stylistId: null };

  connect(params = {}) {
    if (params.userId) this.options.userId = params.userId;
    if (params.stylistId) this.options.stylistId = params.stylistId;

    if (!this.options.userId && !this.options.stylistId) {
      return;
    }

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const queryParts = [];
    if (this.options.userId) queryParts.push(`userId=${encodeURIComponent(this.options.userId)}`);
    if (this.options.stylistId) queryParts.push(`stylistId=${encodeURIComponent(this.options.stylistId)}`);
    const wsUrl = `ws://localhost:8080/ws/notifications?${queryParts.join("&")}`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        console.log("🟢 Notification WebSocket connected successfully");

        // Gửi thông điệp REGISTER xác nhận
        try {
          this.socket.send(JSON.stringify({
            type: "REGISTER",
            userId: this.options.userId,
            stylistId: this.options.stylistId
          }));
        } catch (e) {}

        // Thiết lập Ping heartbeat mỗi 25 giây
        this.startHeartbeat();
      };

      this.socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "PONG") return;

          // Phát sự kiện tới tất cả các subscriber đã đăng ký
          this.listeners.forEach((callback) => {
            try {
              callback(payload);
            } catch (err) {
              console.error("Error executing notification listener callback:", err);
            }
          });
        } catch (error) {
          console.debug("Received raw WebSocket message:", event.data);
        }
      };

      this.socket.onerror = (error) => {
        console.warn("Notification WebSocket warning:", error);
      };

      this.socket.onclose = (event) => {
        this.isConnected = false;
        this.stopHeartbeat();
        console.log("Notification WebSocket disconnected. Code:", event.code);

        // Tự động kết nối lại sau 4 giây nếu không phải do chủ động disconnect
        if (event.code !== 1000 && (this.options.userId || this.options.stylistId)) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => {
            console.log("🔄 Reconnecting Notification WebSocket...");
            this.connect();
          }, 4000);
        }
      };
    } catch (err) {
      console.warn("Cannot instantiate WebSocket:", err);
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.pingTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: "PING" }));
      }
    }, 25000);
  }

  stopHeartbeat() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  disconnect() {
    clearTimeout(this.reconnectTimer);
    this.stopHeartbeat();
    this.options = { userId: null, stylistId: null };
    if (this.socket) {
      try {
        this.socket.close(1000, "Normal Closure");
      } catch (e) {}
      this.socket = null;
    }
    this.isConnected = false;
  }
}

const notificationWs = new NotificationWebSocket();
export default notificationWs;