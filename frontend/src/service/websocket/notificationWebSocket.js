class NotificationWebSocket {
  socket = null;

  connect(url, onMessage, onError, onClose) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) return;

    this.socket = new WebSocket(url);
    this.socket.onopen = () => {
      console.log("Review WebSocket connected");
    };
    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        onMessage(message);
      } catch (error) {
        console.error("Invalid WebSocket message:", error);
      }
    };

    this.socket.onerror = (error) => {
      console.error("Review WebSocket error:", error);
      if (onError) {
        onError(error);
      }
    };

    this.socket.onclose = (event) => {
      console.log("Review WebSocket closed:", event.code);
      this.socket = null;
      if (onClose) {
        onClose(event);
      }
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export default new NotificationWebSocket();