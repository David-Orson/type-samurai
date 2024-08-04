CREATE TABLE IF NOT EXISTS words (
  id SERIAL PRIMARY KEY,
  lowercase VARCHAR(50) NOT NULL,
  attempts JSON NOT NULL,
  recentAttempts JSON NOT NULL,
  recentAverage SMALLINT NOT NULL,
  successAverage SMALLINT NOT NULL,
  pr SMALLINT NOT NULL,
  wordset SMALLINT NOT NULL,
  UNIQUE INDEX idx_lowercase_wordset (lowercase, wordset)
);

