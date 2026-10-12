-- V7: Allow null salon_id in stylists for unassigned or newly registered stylists
ALTER TABLE stylists MODIFY COLUMN salon_id BINARY(16) NULL;

