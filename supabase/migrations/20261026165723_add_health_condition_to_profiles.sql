ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS health_condition text NOT NULL DEFAULT 'none';

COMMENT ON COLUMN profiles.health_condition IS
  'none | pcod | pcos | thyroid | diabetes | insulin_resistance | high_bp';
