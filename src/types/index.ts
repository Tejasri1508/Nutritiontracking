export interface Profile {
  id: string;
  full_name: string;
  username: string | null;
  age: number | null;
  gender: string;
  height: number | null;
  weight: number | null;
  target_weight: number | null;
  activity_level: string;
  goal: string;
  daily_calorie_goal: number;
  water_goal: number;
  step_goal: number;
  sleep_goal: number;
  profile_image: string | null;
  dark_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface FoodEntry {
  id: string;
  user_id: string;
  food_name: string;
  image_url: string | null;
  meal_type: string;
  serving_size: string;
  servings: number;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  confidence: number | null;
  source: string;
  date: string;
  created_at: string;
}

export interface WaterEntry {
  id: string;
  user_id: string;
  amount: number;
  date: string;
  created_at: string;
}

export interface StepEntry {
  id: string;
  user_id: string;
  steps: number;
  date: string;
  created_at: string;
}

export interface SleepEntry {
  id: string;
  user_id: string;
  sleep_time: string | null;
  wake_time: string | null;
  duration: number;
  sleep_quality: string;
  deep_sleep: number;
  light_sleep: number;
  rem_sleep: number;
  awake_time: number;
  date: string;
  created_at: string;
}

export interface WorkoutEntry {
  id: string;
  user_id: string;
  workout_name: string;
  category: string;
  duration: number;
  calories_burned: number;
  difficulty: string;
  date: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  category: string;
  sub_category: string | null;
  meal_type: string;
  dietary_type: string;
  calories: number;
  serving_size: string;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  preparation_time: number;
  cooking_time: number;
  difficulty: string;
  ingredients: string[];
  instructions: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface MealPlan {
  id: string;
  user_id: string;
  recipe_id: string | null;
  meal_type: string;
  date: string;
  servings: number;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  recipe_id: string;
  created_at: string;
}

export interface GroceryListItem {
  id: string;
  user_id: string;
  name: string;
  quantity: string;
  checked: boolean;
  category: string;
  created_at: string;
}

export interface RecentActivity {
  id: string;
  user_id: string;
  activity_type: string;
  description: string;
  icon: string;
  value: string | null;
  created_at: string;
}

export interface DailySummary {
  date: string;
  caloriesConsumed: number;
  caloriesBurned: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  water: number;
  steps: number;
  sleep: number;
}
