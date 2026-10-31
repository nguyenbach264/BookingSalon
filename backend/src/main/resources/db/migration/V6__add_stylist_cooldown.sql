-- V6: Add next_available_on_time to stylists for duty switch cooldown
ALTER TABLE stylists ADD COLUMN next_available_on_time DATETIME NULL;
