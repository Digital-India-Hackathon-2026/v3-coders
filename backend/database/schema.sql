-- Create Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'farmer', 'provider', 'admin'
  extra_info TEXT, -- land details for farmers, machinery details for providers
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Services table (Provider machinery listings)
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'Tractor', 'Harvester', 'Seeder', etc.
  price_per_hour NUMERIC(10,2) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'available', -- 'available', 'unavailable'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  farmer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  hours_required NUMERIC(5,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
  location TEXT NOT NULL,
  farm_lat NUMERIC(10, 7),
  farm_lng NUMERIC(10, 7),
  provider_lat NUMERIC(10, 7),
  provider_lng NUMERIC(10, 7),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
