CREATE TABLE words (
  id SERIAL PRIMARY KEY,
  lowercase VARCHAR(50) NOT NULL,
  attempts JSON NOT NULL,
  recentAverage SMALLINT NOT NULL,
  INDEX idx_lowercase (lowercase)
);

