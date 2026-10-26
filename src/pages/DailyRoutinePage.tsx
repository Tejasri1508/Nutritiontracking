import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getConditionTargets } from '@/utils/helpers';
import type { Recipe } from '@/types';
import {
  Sunrise,
  Droplets,
  Footprints,
  Utensils,
  Moon,
  Apple,
  Dumbbell,
  Plus,
  Check,
  HeartPulse,
  Flame,
  Beef,
  Wheat,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface RoutineItem {
  id: string;
  time: string;
  label: string;
  kind: 'wake' | 'water' | 'meal' | 'snack' | 'activity' | 'sleep';
  icon: typeof Sunrise;
  recipe?: Recipe;
  servings?: number;
  note: string;
}

const MEAL_TIME_MAP = {
  breakfast: '08:00',
  lunch: '13:00',
  dinner: '20:00',
  snack: '17:00',
} as const;

const CONDITION_TIPS: Record<string, string[]> = {
  pcod: [
    'Include 1 tbsp soaked seeds (flax/pumpkin) with breakfast for healthy fats.',
    'Avoid refined sugar — choose low-glycemic fruits like berries, apple, pear.',
    'Walk 10 min after each main meal to blunt post-meal insulin spikes.',
    'Prioritize sleep — PCOD symptoms worsen with poor sleep.',
  ],
  pcos: [
    'Lower-carb, higher-protein meals help regulate insulin in PCOS.',
    'Add anti-inflammatory foods: turmeric, ginger, leafy greens.',
    'Strength training 3x/week improves insulin sensitivity more than cardio alone.',
    'Avoid long gaps between meals — eat every 3–4 hours.',
  ],
  insulin_resistance: [
    'Pair every carb with a protein or fat to slow glucose release.',
    'Choose whole grains over refined — brown rice, oats, quinoa.',
    'A 15-min walk after dinner significantly lowers fasting glucose.',
    'Include cinnamon — it can improve insulin sensitivity.',
  ],
  thyroid: [
    'Cook cruciferous vegetables (cabbage, cauliflower) — avoid them raw.',
    'Include selenium-rich foods: Brazil nuts, eggs, lentils.',
    'Keep iodine steady with iodized salt, dairy, and seaweed in moderation.',
    'Avoid very low-calorie diets — they can slow thyroid function further.',
  ],
  diabetes: [
    'Low-glycemic carbs only — oats, barley, legumes, sweet potato.',
    'Never skip breakfast — it destabilizes blood sugar all day.',
    'Include 1 tbsp vinegar or lemon before meals to lower glucose response.',
    'Fiber target 30–35g/day — vegetables, chia, psyllium.',
  ],
  high_bp: [
    'DASH-style eating: rich in fruits, veg, low-fat dairy, whole grains.',
    'Keep sodium under 1500mg — avoid pickles, papads, packaged snacks.',
    'Potassium-rich foods: banana, spinach, coconut water, tomatoes.',
    'Limit caffeine — 1 cup of tea/coffee in the morning max.',
  ],
  none: [
    'Eat every 3–4 hours to keep energy steady.',
    'Walk 10 min after meals to aid digestion and calorie burn.',
    'Hydrate well — thirst is often mistaken for hunger.',
    'Strength training 2–3x/week preserves metabolism during weight loss.',
  ],
};

export default function DailyRoutinePage() {
  const { profile, user } = useAuth();
  const { showToast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [logged, setLogged] = useState<Record<string, boolean>>({});
  const [routine, setRoutine] = useState<RoutineItem[]>([]);
  const [seed, setSeed] = useState(0);

  const targets = useMemo(
    () =>
      getConditionTargets(
        profile?.daily_calorie_goal ?? 1800,
        profile?.health_condition ?? 'none',
        profile?.gender ?? 'other'
      ),
    [profile]
  );

  const condition = (profile?.health_condition ?? 'none') as string;
  const tips = CONDITION_TIPS[condition] ?? CONDITION_TIPS.none;

  useEffect(() => {
    supabase
      .from('recipes')
      .select('*')
      .order('meal_type')
      .then(({ data, error }) => {
        if (error) {
          showToast('Could not load recipes', 'error');
          return;
        }
        setRecipes((data ?? []) as Recipe[]);
        setLoading(false);
      });
  }, [showToast]);

  useEffect(() => {
    if (recipes.length === 0) return;
    setRoutine(buildRoutine(recipes, targets, seed));
  }, [recipes, targets, seed]);

  const totals = useMemo(() => {
    return routine
      .filter(i => i.recipe)
      .reduce(
        (acc, i) => {
          acc.calories += (i.recipe!.calories * (i.servings ?? 1));
          acc.protein += (i.recipe!.protein * (i.servings ?? 1));
          acc.carbs += (i.recipe!.carbohydrates * (i.servings ?? 1));
          acc.fat += (i.recipe!.fat * (i.servings ?? 1));
          acc.fiber += (i.recipe!.fiber * (i.servings ?? 1));
          return acc;
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
      );
  }, [routine]);

  async function logMeal(item: RoutineItem) {
    if (!user || !item.recipe) return;
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from('food_entries').insert({
      user_id: user.id,
      food_name: item.recipe.title,
      meal_type: item.recipe.meal_type,
      calories: Math.round(item.recipe.calories * (item.servings ?? 1)),
      protein: Math.round(item.recipe.protein * (item.servings ?? 1)),
      carbs: Math.round(item.recipe.carbohydrates * (item.servings ?? 1)),
      fat: Math.round(item.recipe.fat * (item.servings ?? 1)),
      fiber: Math.round(item.recipe.fiber * (item.servings ?? 1)),
      date: today,
      servings: item.servings ?? 1,
    });
    if (error) {
      showToast('Could not log this meal', 'error');
      return;
    }
    setLogged(prev => ({ ...prev, [item.id]: true }));
    showToast(`${item.recipe.title} added to your calorie log`, 'success');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Your Daily Routine
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            A personalized weight-loss plan for{' '}
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {condition === 'none'
                ? 'general wellness'
                : condition.toUpperCase()}
            </span>
          </p>
        </div>
        <button
          onClick={() => setSeed(s => s + 1)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 transition"
        >
          <RefreshCw className="w-4 h-4" /> Regenerate plan
        </button>
      </div>

      {/* Target summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <TargetCard icon={Flame} label="Calories" value={targets.calories} color="text-orange-500" />
        <TargetCard icon={Beef} label="Protein" value={`${targets.protein}g`} color="text-rose-500" />
        <TargetCard icon={Wheat} label="Carbs" value={`${targets.carbs}g`} color="text-amber-500" />
        <TargetCard icon={Droplets} label="Fat" value={`${targets.fat}g`} color="text-sky-500" />
        <TargetCard icon={Sparkles} label="Fiber" value={`${targets.fiber}g`} color="text-emerald-500" />
      </div>

      {/* Condition note */}
      {targets.deficitNote && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
          <HeartPulse className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-800 dark:text-emerald-300">{targets.deficitNote}</p>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-3">
        {routine.map(item => (
          <RoutineCard
            key={item.id}
            item={item}
            logged={!!logged[item.id]}
            onLog={() => logMeal(item)}
          />
        ))}
      </div>

      {/* Plan vs target */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 bg-white dark:bg-neutral-900">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
          Plan totals (from suggested meals)
        </h3>
        <div className="grid grid-cols-5 gap-2 text-center">
          <MacroBar label="Cal" value={Math.round(totals.calories)} target={targets.calories} unit="" />
          <MacroBar label="Protein" value={Math.round(totals.protein)} target={targets.protein} unit="g" />
          <MacroBar label="Carbs" value={Math.round(totals.carbs)} target={targets.carbs} unit="g" />
          <MacroBar label="Fat" value={Math.round(totals.fat)} target={targets.fat} unit="g" />
          <MacroBar label="Fiber" value={Math.round(totals.fiber)} target={targets.fiber} unit="g" />
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 bg-white dark:bg-neutral-900">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          {condition === 'none' ? 'Healthy habits' : `Tips for ${condition.toUpperCase()}`}
        </h3>
        <ul className="space-y-2">
          {tips.map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TargetCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Flame;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 flex flex-col items-center gap-1">
      <Icon className={`w-5 h-5 ${color}`} />
      <span className="text-lg font-bold text-neutral-900 dark:text-white">{value}</span>
      <span className="text-xs text-neutral-400">{label}</span>
    </div>
  );
}

function MacroBar({
  label,
  value,
  target,
  unit,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const over = value > target;
  return (
    <div>
      <div className="text-xs text-neutral-400 mb-1">{label}</div>
      <div className="text-sm font-semibold text-neutral-900 dark:text-white">
        {value}{unit}
      </div>
      <div className="h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 mt-1 overflow-hidden">
        <div
          className={`h-full rounded-full ${over ? 'bg-rose-400' : 'bg-emerald-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function RoutineCard({
  item,
  logged,
  onLog,
}: {
  item: RoutineItem;
  logged: boolean;
  onLog: () => void;
}) {
  const Icon = item.icon;
  const kindStyles: Record<string, string> = {
    wake: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
    water: 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400',
    meal: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    snack: 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400',
    activity: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400',
    sleep: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  };

  return (
    <div className="relative rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
      <div className="flex">
        {/* Time column */}
        <div className={`w-20 flex-shrink-0 flex flex-col items-center justify-center py-4 ${kindStyles[item.kind]}`}>
          <Icon className="w-5 h-5 mb-1" />
          <span className="text-xs font-semibold">{item.time}</span>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-neutral-900 dark:text-white truncate">{item.label}</h3>
              {item.recipe ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {item.recipe.title} · {Math.round(item.recipe.calories * (item.servings ?? 1))} kcal
                  <span className="hidden sm:inline">
                    {' '}· P {Math.round(item.recipe.protein * (item.servings ?? 1))}g · C {Math.round(item.recipe.carbohydrates * (item.servings ?? 1))}g · F {Math.round(item.recipe.fat * (item.servings ?? 1))}g
                  </span>
                </p>
              ) : (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{item.note}</p>
              )}
            </div>
            {item.recipe && (
              <button
                onClick={onLog}
                disabled={logged}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  logged
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                }`}
              >
                {logged ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {logged ? 'Logged' : 'Log'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function buildRoutine(
  recipes: Recipe[],
  targets: ReturnType<typeof getConditionTargets>,
  seed: number
): RoutineItem[] {
  const pickMeal = (mealType: string, caloriesCap: number) => {
    let pool = recipes.filter(r => r.meal_type === mealType);
    if (pool.length === 0) pool = recipes;
    // Prefer lower-calorie, higher-protein for weight loss
    pool = [...pool].sort(
      (a, b) =>
        (b.protein / Math.max(1, b.calories) - a.protein / Math.max(1, a.calories)) ||
        a.calories - b.calories
    );
    const offset = seed % Math.min(5, pool.length || 1);
    const slice = pool.slice(offset, offset + 1).concat(pool).slice(0, 1);
    return slice[0];
  };

  const mealSlots = [
    { type: 'breakfast', time: '08:00', cap: Math.round(targets.calories * 0.25), label: 'Breakfast' },
    { type: 'lunch', time: '13:00', cap: Math.round(targets.calories * 0.32), label: 'Lunch' },
    { type: 'snack', time: '17:00', cap: Math.round(targets.calories * 0.13), label: 'Evening Snack' },
    { type: 'dinner', time: '20:00', cap: Math.round(targets.calories * 0.3), label: 'Dinner' },
  ];

  const items: RoutineItem[] = [
    {
      id: 'wake',
      time: '07:00',
      label: 'Wake up & hydrate',
      kind: 'wake',
      icon: Sunrise,
      note: 'Drink 1–2 glasses of warm water. Optionally add lemon or a splash of apple-cider vinegar.',
    },
    {
      id: 'water-morning',
      time: '09:00',
      label: 'Hydration check',
      kind: 'water',
      icon: Droplets,
      note: '1 glass of water. Keep sipping through the morning.',
    },
  ];

  for (const slot of mealSlots) {
    const recipe = pickMeal(slot.type, slot.cap);
    items.push({
      id: slot.type,
      time: slot.time,
      label: slot.label,
      kind: slot.type === 'snack' ? 'snack' : 'meal',
      icon: slot.type === 'snack' ? Apple : Utensils,
      recipe,
      servings: 1,
      note: '',
    });
  }

  items.push(
    {
      id: 'walk-am',
      time: '10:00',
      label: 'Morning movement',
      kind: 'activity',
      icon: Footprints,
      note: '10–15 min brisk walk or light stretching.',
    },
    {
      id: 'walk-pm',
      time: '15:30',
      label: 'Afternoon walk',
      kind: 'activity',
      icon: Footprints,
      note: '5–10 min walk — breaks long sitting and aids digestion.',
    },
    {
      id: 'workout',
      time: '18:00',
      label: 'Workout',
      kind: 'activity',
      icon: Dumbbell,
      note: '30 min strength or cardio. Aim for 3–4 strength sessions/week.',
    },
    {
      id: 'water-eve',
      time: '21:00',
      label: 'Wind-down hydration',
      kind: 'water',
      icon: Droplets,
      note: 'A small glass of water or herbal tea (chamomile, spearmint).',
    },
    {
      id: 'sleep',
      time: '22:30',
      label: 'Sleep',
      kind: 'sleep',
      icon: Moon,
      note: 'Aim for 7–8 hours. Good sleep regulates hunger hormones.',
    }
  );

  return items.sort((a, b) => a.time.localeCompare(b.time));
}
