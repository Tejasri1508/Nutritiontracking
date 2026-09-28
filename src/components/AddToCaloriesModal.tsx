import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useTodayData } from '@/hooks/useTodayData';
import { supabase } from '@/lib/supabase';
import { Minus, Plus, Utensils, Sun, Moon, Cookie } from 'lucide-react';

interface AddToCaloriesModalProps {
  open: boolean;
  onClose: () => void;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servingSize: string;
  imageUrl?: string | null;
  source?: string;
}

const mealOptions = [
  { value: 'breakfast', label: 'Breakfast', icon: Sun },
  { value: 'lunch', label: 'Lunch', icon: Utensils },
  { value: 'snack', label: 'Snack', icon: Cookie },
  { value: 'dinner', label: 'Dinner', icon: Moon },
];

export function AddToCaloriesModal({
  open,
  onClose,
  foodName,
  calories,
  protein,
  carbs,
  fat,
  fiber,
  servingSize,
  imageUrl,
  source = 'manual',
}: AddToCaloriesModalProps) {
  const { user, profile } = useAuth();
  const { refresh } = useTodayData();
  const { showToast } = useToast();
  const [mealType, setMealType] = useState('lunch');
  const [servings, setServings] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setServings(1);
      const hour = new Date().getHours();
      if (hour < 11) setMealType('breakfast');
      else if (hour < 15) setMealType('lunch');
      else if (hour < 17) setMealType('snack');
      else setMealType('dinner');
    }
  }, [open]);

  const calculatedCalories = Math.round(calories * servings);
  const calculatedProtein = Math.round(protein * servings * 10) / 10;
  const calculatedCarbs = Math.round(carbs * servings * 10) / 10;
  const calculatedFat = Math.round(fat * servings * 10) / 10;
  const calculatedFiber = Math.round(fiber * servings * 10) / 10;

  async function handleAddToTracker() {
    if (!user) return;
    setSaving(true);

    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase.from('food_entries').insert({
      user_id: user.id,
      food_name: foodName,
      image_url: imageUrl || null,
      meal_type: mealType,
      serving_size: servingSize,
      servings,
      calories: calculatedCalories,
      protein: calculatedProtein,
      carbohydrates: calculatedCarbs,
      fat: calculatedFat,
      fiber: calculatedFiber,
      source,
      date: today,
    });

    if (error) {
      showToast('Failed to add food to tracker', 'error');
      setSaving(false);
      return;
    }

    await supabase.from('recent_activity').insert({
      user_id: user.id,
      activity_type: 'food',
      description: `${foodName} added to ${mealType}`,
      icon: 'utensils',
      value: `${calculatedCalories} kcal`,
    });

    const calorieGoal = profile?.daily_calorie_goal || 2000;
    const newConsumed = calculatedCalories;
    const remaining = calorieGoal - newConsumed;

    if (remaining <= 0) {
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Calorie Limit Exceeded',
        message: `Your daily calorie target has been exceeded by ${Math.abs(remaining)} kcal.`,
        type: 'calorie',
      });
    } else if (remaining <= 250) {
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Calorie Reminder',
        message: `You have ${remaining} kcal remaining for today.`,
        type: 'calorie',
      });
    }

    await refresh();
    showToast(`${foodName} added to your ${mealType}!`, 'success');
    setSaving(false);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Add to Daily Calories">
      <div className="space-y-5">
        {imageUrl && (
          <img src={imageUrl} alt={foodName} className="w-full h-36 object-cover rounded-xl" />
        )}

        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4">
          <p className="text-xs text-neutral-500 mb-1">Recipe</p>
          <p className="font-semibold text-neutral-900 dark:text-neutral-100">{foodName}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">{calculatedCalories}</span>
            <span className="text-sm text-neutral-500">kcal</span>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">Meal</label>
          <div className="grid grid-cols-2 gap-2">
            {mealOptions.map(opt => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setMealType(opt.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    mealType === opt.value
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">Servings</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setServings(prev => Math.max(0.5, Math.round((prev - 0.5) * 2) / 2))}
              className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-lg font-bold min-w-[3rem] text-center">{servings}</span>
            <button
              onClick={() => setServings(prev => Math.round((prev + 0.5) * 2) / 2)}
              className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="text-sm text-neutral-400 ml-2">× {servingSize}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
            <p className="text-xs text-neutral-500">Protein</p>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{calculatedProtein}g</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2">
            <p className="text-xs text-neutral-500">Carbs</p>
            <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">{calculatedCarbs}g</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2">
            <p className="text-xs text-neutral-500">Fat</p>
            <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">{calculatedFat}g</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
            <p className="text-xs text-neutral-500">Fiber</p>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">{calculatedFiber}g</p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button onClick={handleAddToTracker} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Adding...' : 'Add to Tracker'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
