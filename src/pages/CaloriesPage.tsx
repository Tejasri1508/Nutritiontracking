import { useState } from 'react';
import { Plus, Trash2, Utensils, Sun, Moon, Cookie } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTodayData, calculateDailyTotals } from '@/hooks/useTodayData';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Modal } from '@/components/ui/Modal';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { formatNumber } from '@/utils/helpers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const mealIcons: Record<string, typeof Sun> = {
  breakfast: Sun,
  lunch: Utensils,
  snack: Cookie,
  dinner: Moon,
};

export function CaloriesPage() {
  const { user, profile } = useAuth();
  const { foodEntries, loading, refresh } = useTodayData();
  const { showToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFood, setNewFood] = useState({ name: '', mealType: 'breakfast', calories: '', protein: '', carbs: '', fat: '', fiber: '' });

  const totals = calculateDailyTotals(foodEntries, []);
  const calorieGoal = profile?.daily_calorie_goal || 2000;

  const meals = {
    breakfast: foodEntries.filter(e => e.meal_type === 'breakfast'),
    lunch: foodEntries.filter(e => e.meal_type === 'lunch'),
    snack: foodEntries.filter(e => e.meal_type === 'snack'),
    dinner: foodEntries.filter(e => e.meal_type === 'dinner'),
  };

  async function addManualFood() {
    if (!user || !newFood.name || !newFood.calories) {
      showToast('Please enter food name and calories', 'error');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('food_entries').insert({
      user_id: user.id,
      food_name: newFood.name,
      meal_type: newFood.mealType,
      calories: Number(newFood.calories),
      protein: Number(newFood.protein) || 0,
      carbohydrates: Number(newFood.carbs) || 0,
      fat: Number(newFood.fat) || 0,
      fiber: Number(newFood.fiber) || 0,
      source: 'manual',
      date: today,
    });
    if (error) {
      showToast('Failed to add food', 'error');
      return;
    }
    await supabase.from('recent_activity').insert({
      user_id: user.id,
      activity_type: 'food',
      description: `${newFood.name} added to ${newFood.mealType}`,
      icon: 'utensils',
      value: `${newFood.calories} kcal`,
    });
    await refresh();
    showToast('Food added successfully!', 'success');
    setShowAddModal(false);
    setNewFood({ name: '', mealType: 'breakfast', calories: '', protein: '', carbs: '', fat: '', fiber: '' });
  }

  async function deleteFood(id: string) {
    const { error } = await supabase.from('food_entries').delete().eq('id', id);
    if (error) {
      showToast('Failed to delete', 'error');
      return;
    }
    await refresh();
    showToast('Food entry deleted', 'info');
  }

  if (loading) return <LoadingState message="Loading calorie data..." />;

  const chartData = [
    { name: 'Protein', value: Math.round(totals.protein), fill: '#3b82f6' },
    { name: 'Carbs', value: Math.round(totals.carbs), fill: '#f97316' },
    { name: 'Fat', value: Math.round(totals.fat), fill: '#a855f7' },
    { name: 'Fiber', value: Math.round(totals.fiber), fill: '#22c55e' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Daily Calories</h1>
          <p className="text-sm text-neutral-500 mt-1">Track your calorie intake throughout the day</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Food
        </button>
      </div>

      {/* Summary */}
      <div className="card flex flex-col sm:flex-row items-center gap-6">
        <ProgressRing
          value={totals.caloriesConsumed}
          max={calorieGoal}
          size={140}
          label={formatNumber(totals.caloriesConsumed)}
          sublabel={`of ${formatNumber(calorieGoal)}`}
          unit=" kcal"
          color={totals.caloriesConsumed > calorieGoal ? '#ef4444' : '#22c55e'}
        />
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center">
            <p className="text-xs text-neutral-500">Consumed</p>
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{formatNumber(totals.caloriesConsumed)}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
            <p className="text-xs text-neutral-500">Remaining</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatNumber(Math.max(0, calorieGoal - totals.caloriesConsumed))}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
            <p className="text-xs text-neutral-500">Protein</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{Math.round(totals.protein)}g</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
            <p className="text-xs text-neutral-500">Fat</p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{Math.round(totals.fat)}g</p>
          </div>
        </div>
      </div>

      {/* Macro chart */}
      <div className="card">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">Macronutrient Breakdown (grams)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:opacity-20" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Food Diary */}
      <div className="card">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">Food Diary</h3>
        <div className="space-y-4">
          {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map(mealType => {
            const Icon = mealIcons[mealType];
            const entries = meals[mealType];
            const mealCalories = entries.reduce((sum, e) => sum + e.calories, 0);
            return (
              <div key={mealType}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm font-medium capitalize text-neutral-700 dark:text-neutral-300">{mealType}</span>
                    <span className="text-xs text-neutral-400">{mealCalories} kcal</span>
                  </div>
                </div>
                {entries.length === 0 ? (
                  <p className="text-xs text-neutral-300 dark:text-neutral-700 italic pl-6">No items logged</p>
                ) : (
                  <div className="space-y-1.5 pl-6">
                    {entries.map(entry => (
                      <div key={entry.id} className="flex items-center gap-2 py-1.5 group">
                        {entry.image_url ? (
                          <img src={entry.image_url} alt={entry.food_name} className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                            <Utensils className="w-4 h-4 text-neutral-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-neutral-700 dark:text-neutral-300 truncate">{entry.food_name}</p>
                          <p className="text-xs text-neutral-400">
                            {entry.calories} kcal • P:{entry.protein}g C:{entry.carbohydrates}g F:{entry.fat}g
                          </p>
                        </div>
                        <button
                          onClick={() => deleteFood(entry.id)}
                          className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Food Manually">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Food Name *</label>
            <input type="text" value={newFood.name} onChange={e => setNewFood(prev => ({ ...prev, name: e.target.value }))} className="input-field" placeholder="e.g., Apple" />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Meal Type</label>
            <select value={newFood.mealType} onChange={e => setNewFood(prev => ({ ...prev, mealType: e.target.value }))} className="input-field">
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="snack">Snack</option>
              <option value="dinner">Dinner</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Calories *</label>
            <input type="number" value={newFood.calories} onChange={e => setNewFood(prev => ({ ...prev, calories: e.target.value }))} className="input-field" placeholder="e.g., 150" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Protein (g)</label>
              <input type="number" value={newFood.protein} onChange={e => setNewFood(prev => ({ ...prev, protein: e.target.value }))} className="input-field text-sm" placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Carbs (g)</label>
              <input type="number" value={newFood.carbs} onChange={e => setNewFood(prev => ({ ...prev, carbs: e.target.value }))} className="input-field text-sm" placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Fat (g)</label>
              <input type="number" value={newFood.fat} onChange={e => setNewFood(prev => ({ ...prev, fat: e.target.value }))} className="input-field text-sm" placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Fiber (g)</label>
              <input type="number" value={newFood.fiber} onChange={e => setNewFood(prev => ({ ...prev, fiber: e.target.value }))} className="input-field text-sm" placeholder="0" />
            </div>
          </div>
          <button onClick={addManualFood} className="btn-primary w-full">Add to Diary</button>
        </div>
      </Modal>
    </div>
  );
}
