-- Complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,         -- 'payment', 'service_quality', 'driver_behavior', 'booking', 'other'
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,  -- optional linked booking
  status VARCHAR(30) DEFAULT 'open',       -- 'open', 'in_review', 'resolved', 'closed'
  priority VARCHAR(20) DEFAULT 'normal',   -- 'low', 'normal', 'high', 'urgent'
  admin_response TEXT,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
