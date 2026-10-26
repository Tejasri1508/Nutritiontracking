export function calculateCalorieGoal(
  weight: number,
  height: number,
  age: number,
  gender: string,
  activityLevel: string,
  goal: string
): number {
  // Mifflin-St Jeor Equation
  let bmr: number;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else if (gender === 'female') {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age;
  }

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const tdee = bmr * (activityMultipliers[activityLevel] || 1.55);

  let goalCalories = tdee;
  if (goal === 'weight_loss') goalCalories = tdee - 500;
  if (goal === 'weight_gain') goalCalories = tdee + 500;

  return Math.round(goalCalories);
}

export type HealthCondition =
  | 'none'
  | 'pcod'
  | 'pcos'
  | 'thyroid'
  | 'diabetes'
  | 'insulin_resistance'
  | 'high_bp';

export interface DailyTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  water: number; // glasses
  deficitNote: string;
}

export function getConditionTargets(
  baseCalories: number,
  condition: string,
  gender: string
): DailyTargets {
  const c = (condition || 'none') as HealthCondition;
  let calories = baseCalories;
  let proteinPct = 0.25;
  let carbsPct = 0.45;
  let fatPct = 0.30;
  let fiber = 25;
  let water = 8;
  let note = '';

  if (c === 'pcod' || c === 'pcos' || c === 'insulin_resistance') {
    calories = Math.max(1200, Math.round(baseCalories * 0.82));
    proteinPct = 0.30;
    carbsPct = 0.35;
    fatPct = 0.35;
    fiber = 30;
    water = 10;
    note =
      'Lower-carb, higher-protein plan to improve insulin sensitivity. Focus on whole grains, legumes, lean protein, and healthy fats.';
  } else if (c === 'thyroid') {
    calories = Math.max(1200, Math.round(baseCalories * 0.85));
    proteinPct = 0.25;
    carbsPct = 0.50;
    fatPct = 0.25;
    fiber = 30;
    water = 9;
    note =
      'Balanced plan with selenium- and iodine-rich foods. Avoid raw cruciferous vegetables in bulk; cook them.';
  } else if (c === 'diabetes') {
    calories = Math.max(1300, Math.round(baseCalories * 0.85));
    proteinPct = 0.25;
    carbsPct = 0.40;
    fatPct = 0.35;
    fiber = 35;
    water = 10;
    note =
      'Low-glycemic plan with complex carbs, high fiber, and healthy fats to keep blood sugar stable.';
  } else if (c === 'high_bp') {
    calories = Math.max(1300, Math.round(baseCalories * 0.90));
    proteinPct = 0.25;
    carbsPct = 0.50;
    fatPct = 0.25;
    fiber = 30;
    water = 10;
    note =
      'DASH-style plan: low sodium, high potassium from fruits and vegetables, whole grains, and lean protein.';
  } else {
    note = 'Balanced deficit plan for steady, sustainable weight loss.';
  }

  if (gender === 'female' && calories < 1200) calories = 1200;
  if (gender === 'male' && calories < 1500) calories = 1500;

  return {
    calories,
    protein: Math.round((calories * proteinPct) / 4),
    carbs: Math.round((calories * carbsPct) / 4),
    fat: Math.round((calories * fatPct) / 9),
    fiber,
    water,
    deficitNote: note,
  };
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTimeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays < 7) return `${diffDays} day ago`;
  return past.toLocaleDateString();
}

export function getMealIcon(mealType: string): string {
  const icons: Record<string, string> = {
    breakfast: 'sunrise',
    lunch: 'sun',
    snack: 'cookie',
    dinner: 'moon',
  };
  return icons[mealType] || 'utensils';
}

export function formatNumber(num: number, decimals = 0): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
