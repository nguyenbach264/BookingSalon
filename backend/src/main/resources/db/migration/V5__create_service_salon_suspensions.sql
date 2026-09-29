-- ==============================================================================
-- Flyway Migration V5: Create Service Salon Suspensions Table
-- ==============================================================================

CREATE TABLE IF NOT EXISTS service_salon_suspensions (
    id BINARY(16) NOT NULL,
    service_offering_id BINARY(16) NOT NULL,
    salon_id BINARY(16) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    reason VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_sss_service FOREIGN KEY (service_offering_id) REFERENCES service_offerings (service_offering_id) ON DELETE CASCADE,
    CONSTRAINT fk_sss_salon FOREIGN KEY (salon_id) REFERENCES salons (salon_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_sss_lookup ON service_salon_suspensions (service_offering_id, salon_id, is_active, start_time, end_time);
