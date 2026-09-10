ALTER TABLE payments MODIFY COLUMN status VARCHAR (20) NOT NULL;
ALTER TABLE payment_transactions MODIFY COLUMN status VARCHAR (20) NOT NULL;

CREATE TABLE IF NOT EXISTS shedlock
(
    name       VARCHAR(64)  NOT NULL,
    lock_until TIMESTAMP(3) NOT NULL,
    locked_at  TIMESTAMP(3) NOT NULL,
    locked_by  VARCHAR(255) NOT NULL,
    PRIMARY KEY (name)
);