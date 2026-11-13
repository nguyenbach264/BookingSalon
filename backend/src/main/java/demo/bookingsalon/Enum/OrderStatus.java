package demo.bookingsalon.Enum;

/**
 * Order status enumeration representing different states of an order lifecycle.
 */
public enum OrderStatus {
    PENDING,
    CONFIRMED,
    PROCESSING,
    SHIPPING,
    DELIVERED,
    CANCELLED,
    REFUNDED;

    /**
     * Returns true if this status represents a completed order.
     */
    public boolean isCompleted() {
        return this == DELIVERED || this == CANCELLED || this == REFUNDED;
    }
}

