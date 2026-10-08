-- ==============================================================================
-- V4: Add VNPay fields to orders table for Shop Order VNPay redirect flow
-- vnpay_txn_ref: VNPay transaction reference (starts with "ORD" for shop orders)
-- vnpay_url: Generated VNPay payment redirect URL (stored for retry purposes)
-- ==============================================================================

ALTER TABLE orders
    ADD COLUMN vnpay_txn_ref VARCHAR(60) NULL COMMENT 'VNPay transaction reference for shop order',
    ADD COLUMN vnpay_url TEXT NULL COMMENT 'Generated VNPay payment URL for redirect';

CREATE INDEX idx_orders_vnpay_txn_ref ON orders (vnpay_txn_ref);
