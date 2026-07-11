-- Add payment columns to bookings table if they do not exist
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_transaction_id VARCHAR(100) DEFAULT NULL;
