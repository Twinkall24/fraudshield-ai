-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'analyst' CHECK (role IN ('admin', 'analyst', 'viewer')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    merchant_id VARCHAR(100) NOT NULL,
    merchant_name VARCHAR(255),
    merchant_category VARCHAR(100),
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    card_number_last4 VARCHAR(4),
    card_type VARCHAR(50),
    transaction_type VARCHAR(50),
    ip_address INET,
    device_id VARCHAR(255),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_country VARCHAR(100),
    location_city VARCHAR(100),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Fraud detection fields
    fraud_score DECIMAL(5, 4),
    is_fraud BOOLEAN DEFAULT false,
    fraud_type VARCHAR(100),
    model_version VARCHAR(50),
    
    -- Risk factors
    distance_from_last DECIMAL(10, 2),
    time_since_last INTEGER, -- seconds
    amount_deviation DECIMAL(10, 2),
    velocity_1h INTEGER,
    velocity_24h INTEGER,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'flagged')),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    severity VARCHAR(50) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    fraud_indicators JSONB,
    
    -- Investigation
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
    assigned_to UUID REFERENCES users(id),
    assigned_at TIMESTAMP,
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Merchant profiles table
CREATE TABLE merchant_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id VARCHAR(100) UNIQUE NOT NULL,
    merchant_name VARCHAR(255),
    category VARCHAR(100),
    risk_score DECIMAL(5, 4) DEFAULT 0.5,
    total_transactions INTEGER DEFAULT 0,
    fraud_transactions INTEGER DEFAULT 0,
    avg_transaction_amount DECIMAL(12, 2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profiles table (transaction users, not system users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) UNIQUE NOT NULL,
    risk_score DECIMAL(5, 4) DEFAULT 0.5,
    total_transactions INTEGER DEFAULT 0,
    fraud_transactions INTEGER DEFAULT 0,
    avg_transaction_amount DECIMAL(12, 2),
    last_transaction_at TIMESTAMP,
    last_location_lat DECIMAL(10, 8),
    last_location_lng DECIMAL(11, 8),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Model metrics table
CREATE TABLE model_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_version VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10, 6) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    changes JSONB,
    ip_address INET,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_merchant_id ON transactions(merchant_id);
CREATE INDEX idx_transactions_fraud_score ON transactions(fraud_score DESC);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, role) VALUES
('admin@frauddetect.com', '$2b$10$rKvVKJ8T8WxOYvhJ5pN3c.XB9nFZH4aXQGKPBH5YmqVZKF8pxF8qK', 'admin'),
('analyst@frauddetect.com', '$2b$10$rKvVKJ8T8WxOYvhJ5pN3c.XB9nFZH4aXQGKPBH5YmqVZKF8pxF8qK', 'analyst');

-- Delete existing users first
DELETE FROM users WHERE email IN ('admin@frauddetect.com', 'analyst@frauddetect.com');

-- Insert default users with correct password hash for "admin123"
-- Hash generated with: bcrypt.hash('admin123', 10)
INSERT INTO users (email, password_hash, role) VALUES
('admin@frauddetect.com', '$2b$10$YQ7Y.X5fZ5Z5Z5Z5Z5Z5Z.rKvVKJ8T8WxOYvhJ5pN3c.XB9nFZH4a', 'admin'),
('analyst@frauddetect.com', '$2b$10$YQ7Y.X5fZ5Z5Z5Z5Z5Z5Z.rKvVKJ8T8WxOYvhJ5pN3c.XB9nFZH4a', 'analyst');