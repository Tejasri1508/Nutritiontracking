/*
# Nutrition Tracker — Full Schema

This migration creates the complete database for a full-stack Nutrition & Wellness tracking app.

## Tables Created
1. `profiles` — Extended user profile data (Supabase auth.users handles email/password). Stores height, weight, goals, targets.
2. `food_entries` — Logged food items with meal type, nutrition, serving, and optional image URL.
3. `water_entries` — Water consumption records per date/time.
4. `step_entries` — Daily step counts.
5. `sleep_entries` — Sleep tracking (sleep time, wake time, duration, quality).
6. `workout_entries` — Workout records (name, duration, calories burned, difficulty).
7. `notifications` — User notifications with type, read status, timestamps.
8. `recipes` — Recipe catalog (diet/normal/desserts categories with sub-categories, full nutrition, ingredients, instructions).
9. `meal_plans` — User meal plan entries referencing recipes or custom meals.
10. `favorites` — User favorite recipes.
11. `grocery_list_items` — User grocery list items (can be added from recipe ingredients).
12. `recent_activity` — Aggregated recent activity feed for the user.

## Security
- All tables are owner-scoped to the authenticated user via `user_id` with `DEFAULT auth.uid()`.
- 4 separate RLS policies per table (SELECT, INSERT, UPDATE, DELETE).
- `recipes` table is world-readable (authenticated can read all recipes) but only owner can modify their own.

## Notes
1. All user-scoped tables use `user_id uuid NOT NULL DEFAULT auth.uid()`.
2. Indexes created on (user_id, date) for all time-series tables.
3. Recipes are shared across all users (SELECT to authenticated, INSERT/UPDATE/DELETE for owner only).
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  username text UNIQUE,
  age int,
  gender text DEFAULT 'other',
  height numeric, -- in cm
  weight numeric, -- in kg
  target_weight numeric, -- in kg
  activity_level text DEFAULT 'moderate',
  goal text DEFAULT 'maintenance',
  daily_calorie_goal int DEFAULT 2000,
  water_goal numeric DEFAULT 2.5, -- in liters
  step_goal int DEFAULT 10000,
  sleep_goal numeric DEFAULT 8, -- in hours
  profile_image text,
  dark_mode boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- FOOD ENTRIES
CREATE TABLE IF NOT EXISTS food_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name text NOT NULL,
  image_url text,
  meal_type text NOT NULL DEFAULT 'snack', -- breakfast, lunch, snack, dinner
  serving_size text DEFAULT '1 serving',
  servings numeric DEFAULT 1,
  calories numeric NOT NULL DEFAULT 0,
  protein numeric DEFAULT 0,
  carbohydrates numeric DEFAULT 0,
  fat numeric DEFAULT 0,
  fiber numeric DEFAULT 0,
  confidence numeric,
  source text DEFAULT 'manual', -- manual, scanner, recipe
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_food" ON food_entries;
CREATE POLICY "select_own_food" ON food_entries FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_food" ON food_entries;
CREATE POLICY "insert_own_food" ON food_entries FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_food" ON food_entries;
CREATE POLICY "update_own_food" ON food_entries FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_food" ON food_entries;
CREATE POLICY "delete_own_food" ON food_entries FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_food_entries_user_date ON food_entries(user_id, date);

-- WATER ENTRIES
CREATE TABLE IF NOT EXISTS water_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL, -- in ml
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE water_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_water" ON water_entries;
CREATE POLICY "select_own_water" ON water_entries FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_water" ON water_entries;
CREATE POLICY "insert_own_water" ON water_entries FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_water" ON water_entries;
CREATE POLICY "update_own_water" ON water_entries FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_water" ON water_entries;
CREATE POLICY "delete_own_water" ON water_entries FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_water_entries_user_date ON water_entries(user_id, date);

-- STEP ENTRIES
CREATE TABLE IF NOT EXISTS step_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  steps int NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE step_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_steps" ON step_entries;
CREATE POLICY "select_own_steps" ON step_entries FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_steps" ON step_entries;
CREATE POLICY "insert_own_steps" ON step_entries FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_steps" ON step_entries;
CREATE POLICY "update_own_steps" ON step_entries FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_steps" ON step_entries;
CREATE POLICY "delete_own_steps" ON step_entries FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_step_entries_user_date ON step_entries(user_id, date);

-- SLEEP ENTRIES
CREATE TABLE IF NOT EXISTS sleep_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  sleep_time timestamptz,
  wake_time timestamptz,
  duration numeric NOT NULL DEFAULT 0, -- in hours
  sleep_quality text DEFAULT 'good', -- poor, fair, good, excellent
  deep_sleep numeric DEFAULT 0, -- in hours
  light_sleep numeric DEFAULT 0,
  rem_sleep numeric DEFAULT 0,
  awake_time numeric DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE sleep_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_sleep" ON sleep_entries;
CREATE POLICY "select_own_sleep" ON sleep_entries FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_sleep" ON sleep_entries;
CREATE POLICY "insert_own_sleep" ON sleep_entries FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_sleep" ON sleep_entries;
CREATE POLICY "update_own_sleep" ON sleep_entries FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_sleep" ON sleep_entries;
CREATE POLICY "delete_own_sleep" ON sleep_entries FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sleep_entries_user_date ON sleep_entries(user_id, date);

-- WORKOUT ENTRIES
CREATE TABLE IF NOT EXISTS workout_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_name text NOT NULL,
  category text DEFAULT 'strength', -- cardio, strength, flexibility
  duration int NOT NULL DEFAULT 0, -- in minutes
  calories_burned numeric DEFAULT 0,
  difficulty text DEFAULT 'intermediate', -- beginner, intermediate, advanced
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE workout_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_workouts" ON workout_entries;
CREATE POLICY "select_own_workouts" ON workout_entries FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_workouts" ON workout_entries;
CREATE POLICY "insert_own_workouts" ON workout_entries FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_workouts" ON workout_entries;
CREATE POLICY "update_own_workouts" ON workout_entries FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_workouts" ON workout_entries;
CREATE POLICY "delete_own_workouts" ON workout_entries FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_workout_entries_user_date ON workout_entries(user_id, date);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info', -- water, step, calorie, meal, workout, sleep, goal, food, auth
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- RECIPES (shared — all authenticated users can read)
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image text,
  category text NOT NULL, -- diet, normal, desserts
  sub_category text, -- weight-loss, weight-gain, breakfast, lunch, dinner, snacks, vegetarian, non-vegetarian, indian, south-indian, quick-meals, family-meals, cakes, brownies, ice-cream, puddings, cookies, cheesecake, indian-sweets, gulab-jamun, rasgulla, kheer, halwa, fruit-desserts, healthy-desserts, chocolate-desserts, no-bake-desserts
  meal_type text DEFAULT 'lunch', -- breakfast, lunch, dinner, snack
  dietary_type text DEFAULT 'vegetarian', -- vegetarian, non-vegetarian, vegan
  calories numeric NOT NULL DEFAULT 0,
  serving_size text DEFAULT '1 serving',
  protein numeric DEFAULT 0,
  carbohydrates numeric DEFAULT 0,
  fat numeric DEFAULT 0,
  fiber numeric DEFAULT 0,
  preparation_time int DEFAULT 15, -- in minutes
  cooking_time int DEFAULT 30,
  difficulty text DEFAULT 'easy', -- easy, medium, hard
  ingredients text[] DEFAULT '{}',
  instructions text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_recipes" ON recipes;
CREATE POLICY "select_recipes" ON recipes FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_recipes" ON recipes;
CREATE POLICY "insert_own_recipes" ON recipes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "update_own_recipes" ON recipes;
CREATE POLICY "update_own_recipes" ON recipes FOR UPDATE
  TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "delete_own_recipes" ON recipes;
CREATE POLICY "delete_own_recipes" ON recipes FOR DELETE
  TO authenticated USING (auth.uid() = created_by);

CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category, sub_category);

-- MEAL PLANS
CREATE TABLE IF NOT EXISTS meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
  meal_type text NOT NULL DEFAULT 'lunch',
  date date NOT NULL DEFAULT CURRENT_DATE,
  servings numeric DEFAULT 1,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_meal_plans" ON meal_plans;
CREATE POLICY "select_own_meal_plans" ON meal_plans FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_meal_plans" ON meal_plans;
CREATE POLICY "insert_own_meal_plans" ON meal_plans FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_meal_plans" ON meal_plans;
CREATE POLICY "update_own_meal_plans" ON meal_plans FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_meal_plans" ON meal_plans;
CREATE POLICY "delete_own_meal_plans" ON meal_plans FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date ON meal_plans(user_id, date);

-- FAVORITES
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_favorites" ON favorites;
CREATE POLICY "select_own_favorites" ON favorites FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_favorites" ON favorites;
CREATE POLICY "insert_own_favorites" ON favorites FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_favorites" ON favorites;
CREATE POLICY "update_own_favorites" ON favorites FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_favorites" ON favorites;
CREATE POLICY "delete_own_favorites" ON favorites FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_user_recipe ON favorites(user_id, recipe_id);

-- GROCERY LIST ITEMS
CREATE TABLE IF NOT EXISTS grocery_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity text DEFAULT '1',
  checked boolean DEFAULT false,
  category text DEFAULT 'other',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE grocery_list_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_grocery" ON grocery_list_items;
CREATE POLICY "select_own_grocery" ON grocery_list_items FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_grocery" ON grocery_list_items;
CREATE POLICY "insert_own_grocery" ON grocery_list_items FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_grocery" ON grocery_list_items;
CREATE POLICY "update_own_grocery" ON grocery_list_items FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_grocery" ON grocery_list_items;
CREATE POLICY "delete_own_grocery" ON grocery_list_items FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_grocery_user ON grocery_list_items(user_id);

-- RECENT ACTIVITY
CREATE TABLE IF NOT EXISTS recent_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL, -- food, water, steps, sleep, workout, goal
  description text NOT NULL,
  icon text DEFAULT 'utensils',
  value text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE recent_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_activity" ON recent_activity;
CREATE POLICY "select_own_activity" ON recent_activity FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_activity" ON recent_activity;
CREATE POLICY "insert_own_activity" ON recent_activity FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_activity" ON recent_activity;
CREATE POLICY "update_own_activity" ON recent_activity FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_activity" ON recent_activity;
CREATE POLICY "delete_own_activity" ON recent_activity FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_activity_user_created ON recent_activity(user_id, created_at DESC);