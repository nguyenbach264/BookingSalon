package demo.bookingsalon.Handler;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

@Component
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private final Set<WebSocketSession> sessions = new CopyOnWriteArraySet<>();

    // CLIENT CONNECT
    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
        System.out.println("Client connected: " + session.getId());

        System.out.println("Total clients: " + sessions.size());
    }


    // RECEIVE MESSAGE
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        System.out.println("Received from " + session.getId() + ": " + message.getPayload());
    }


    // CLIENT DISCONNECT
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        System.out.println("Client disconnected: " + session.getId());
        System.out.println("Total clients: " + sessions.size());
    }


    // BROADCAST MESSAGE
    public void broadcast(String message) {
        for (WebSocketSession session : sessions) {
            if (!session.isOpen()) continue;
            try {
                session.sendMessage(new TextMessage(message));
            } catch (IOException e) {
                System.err.println("Cannot send message to " + session.getId());
            }
        }
    }
}