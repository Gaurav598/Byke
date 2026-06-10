CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    mobile_number VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    profile_photo_url VARCHAR(255),
    role VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'ACTIVE',
    home_address VARCHAR(255),
    work_address VARCHAR(255),
    total_bookings INTEGER NOT NULL DEFAULT 0,
    average_rating_given DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    average_rating_received DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    fcm_token VARCHAR(255),
    fixed_otp VARCHAR(4),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE riders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id),
    date_of_birth DATE,
    gender VARCHAR(255),
    home_address VARCHAR(255),
    vehicle_type VARCHAR(255),
    vehicle_make VARCHAR(255),
    vehicle_model VARCHAR(255),
    vehicle_year INTEGER,
    vehicle_registration_number VARCHAR(255),
    vehicle_color VARCHAR(255),
    driving_license_url VARCHAR(255),
    aadhar_card_url VARCHAR(255),
    pan_card_url VARCHAR(255),
    vehicle_rc_url VARCHAR(255),
    vehicle_insurance_url VARCHAR(255),
    vehicle_puc_url VARCHAR(255),
    vehicle_photo_url VARCHAR(255),
    selfie_with_vehicle_url VARCHAR(255),
    bank_account_number VARCHAR(255),
    bank_ifsc_code VARCHAR(255),
    bank_account_holder_name VARCHAR(255),
    status VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    subscription_start_date TIMESTAMP WITHOUT TIME ZONE,
    subscription_end_date TIMESTAMP WITHOUT TIME ZONE,
    subscription_active BOOLEAN DEFAULT FALSE,
    total_rides INTEGER NOT NULL DEFAULT 0,
    average_rating DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    total_ratings INTEGER NOT NULL DEFAULT 0,
    cancellation_count INTEGER NOT NULL DEFAULT 0,
    acceptance_rate DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    current_location GEOMETRY(Point, 4326),
    last_location_update TIMESTAMP WITHOUT TIME ZONE,
    rejection_reason VARCHAR(255),
    suspension_reason VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE bookings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    rider_id BIGINT REFERENCES riders(id),
    service_type VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    pickup_address VARCHAR(255) NOT NULL,
    pickup_location GEOMETRY(Point, 4326),
    drop_address VARCHAR(255),
    drop_location GEOMETRY(Point, 4326),
    errand_description VARCHAR(2000),
    errand_items_list VARCHAR(1000),
    estimated_budget DOUBLE PRECISION,
    parcel_description VARCHAR(255),
    parcel_weight VARCHAR(255),
    recipient_name VARCHAR(255),
    recipient_phone VARCHAR(255),
    estimated_distance DOUBLE PRECISION,
    estimated_duration INTEGER,
    estimated_fare DOUBLE PRECISION,
    final_fare DOUBLE PRECISION,
    verification_otp VARCHAR(4),
    user_entered_amount DOUBLE PRECISION,
    bidding_window_seconds INTEGER DEFAULT 45,
    bidding_start_time TIMESTAMP WITHOUT TIME ZONE,
    bidding_end_time TIMESTAMP WITHOUT TIME ZONE,
    accepted_at TIMESTAMP WITHOUT TIME ZONE,
    rider_arrived_at TIMESTAMP WITHOUT TIME ZONE,
    started_at TIMESTAMP WITHOUT TIME ZONE,
    completed_at TIMESTAMP WITHOUT TIME ZONE,
    cancelled_at TIMESTAMP WITHOUT TIME ZONE,
    vehicle_type VARCHAR(255),
    cancellation_reason VARCHAR(255),
    cancellation_reason_detail VARCHAR(255),
    user_rating INTEGER,
    user_review VARCHAR(255),
    rider_rating INTEGER,
    rider_review VARCHAR(255),
    route_polyline VARCHAR(5000),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE bids (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL REFERENCES bookings(id),
    rider_id BIGINT NOT NULL REFERENCES riders(id),
    bid_amount DOUBLE PRECISION NOT NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    is_edited BOOLEAN DEFAULT FALSE,
    previous_bid_amount DOUBLE PRECISION,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    rider_id BIGINT NOT NULL REFERENCES riders(id),
    amount DOUBLE PRECISION NOT NULL,
    payment_method VARCHAR(255) NOT NULL,
    transaction_id VARCHAR(255) NOT NULL,
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    status VARCHAR(255) NOT NULL,
    failure_reason VARCHAR(255),
    period_start TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    period_end TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE TABLE complaints (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT REFERENCES bookings(id),
    filed_by_user_id BIGINT NOT NULL REFERENCES users(id),
    against_user_id BIGINT REFERENCES users(id),
    complaint_type VARCHAR(255) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    priority VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL,
    resolution VARCHAR(2000),
    resolved_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    type VARCHAR(255) NOT NULL,
    booking_id BIGINT REFERENCES bookings(id),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE TABLE chat_messages (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL REFERENCES bookings(id),
    sender_user_id BIGINT NOT NULL REFERENCES users(id),
    message VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    token VARCHAR(255) NOT NULL UNIQUE,
    expiry_date TIMESTAMP WITHOUT TIME ZONE NOT NULL
);
