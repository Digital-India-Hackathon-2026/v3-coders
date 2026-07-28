-- Add pricing_model to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS pricing_model VARCHAR(30) DEFAULT 'hourly'; -- 'hourly' or 'fixed'

-- Add job execution timer & actual hours columns to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS start_time TIMESTAMP;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stop_time TIMESTAMP;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS actual_hours NUMERIC(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS timer_status VARCHAR(20) DEFAULT 'idle'; -- 'idle', 'running', 'stopped'
