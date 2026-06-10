CREATE TABLE support_tickets (
    id BIGSERIAL PRIMARY KEY,
    ticket_id VARCHAR(50) NOT NULL UNIQUE,
    user_id BIGINT REFERENCES users(id),
    rider_id BIGINT REFERENCES riders(id),
    booking_id BIGINT REFERENCES bookings(id),
    category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    priority VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE support_ticket_replies (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES support_tickets(id),
    sender_id BIGINT,
    sender_type VARCHAR(50) NOT NULL, -- 'USER', 'RIDER', 'ADMIN'
    message VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);
