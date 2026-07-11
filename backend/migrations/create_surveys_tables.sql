-- Create Price Surveys table
CREATE TABLE IF NOT EXISTS price_surveys (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  description TEXT,
  deadline DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'closed'
  finalized_price NUMERIC(10,2),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Price Survey Responses table
CREATE TABLE IF NOT EXISTS price_survey_responses (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER REFERENCES price_surveys(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  suggested_price NUMERIC(10,2) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(survey_id, user_id) -- one response per user per survey
);
