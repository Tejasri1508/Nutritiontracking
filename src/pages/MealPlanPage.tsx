import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Trash2, ChefHat, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { LoadingState, EmptyState } from '@/components/ui/States';
import type { MealPlan, Recipe } from '@/types';

export function MealPlanPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newPlan, setNewPlan] = useState({ recipeId: '', mealType: 'breakfast', date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      const [planRes, recipeRes] = await Promise.all([
        supabase.from('meal_plans').select('*').eq('user_id', user.id).order('date', { ascending: true }),
        supabase.from('recipes').select('id, title, calories, image').limit(50),
      ]);
      setMealPlans((planRes.data as MealPlan[]) || []);
      setRecipes((recipeRes.data as Recipe[]) || []);
      setLoading(false);
    }
    fetchData();
  }, [user]);

  async function addPlan() {
    if (!user || !newPlan.recipeId) {
      showToast('Please select a recipe', 'error');
      return;
    }
    const { error } = await supabase.from('meal_plans').insert({
      user_id: user.id,
      recipe_id: newPlan.recipeId,
      meal_type: newPlan.mealType,
      date: newPlan.date,
      servings: 1,
    });
    if (error) {
      showToast('Failed to add meal plan', 'error');
      return;
    }
    showToast('Added to meal plan!', 'success');
    setShowAdd(false);
    const { data } = await supabase.from('meal_plans').select('*').eq('user_id', user.id).order('date', { ascending: true });
    setMealPlans((data as MealPlan[]) || []);
  }

  async function deletePlan(id: string) {
    const { error } = await supabase.from('meal_plans').delete().eq('id', id);
    if (error) {
      showToast('Failed to delete', 'error');
      return;
    }
    setMealPlans(prev => prev.filter(p => p.id !== id));
    showToast('Removed from meal plan', 'info');
  }

  const groupedByDate = mealPlans.reduce((acc, plan) => {
    if (!acc[plan.date]) acc[plan.date] = [];
    acc[plan.date].push(plan);
    return acc;
  }, {} as Record<string, MealPlan[]>);

  if (loading) return <LoadingState message="Loading meal plan..." />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Meal Plan</h1>
          <p className="text-sm text-neutral-500 mt-1">Plan your meals ahead of time</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Meal
        </button>
      </div>

      {Object.keys(groupedByDate).length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-12 h-12" />}
          title="No meals planned yet"
          description="Add recipes to your meal plan to organize your weekly meals."
          action={<button onClick={() => setShowAdd(true)} className="btn-primary">Add Your First Meal</button>}
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, plans]) => (
            <div key={date} className="card">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-green-500" />
                <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h3>
              </div>
              <div className="space-y-2">
                {plans.map(plan => {
                  const recipe = recipes.find(r => r.id === plan.recipe_id);
                  return (
                    <div key={plan.id} className="flex items-center gap-3 py-2 group">
                      {recipe?.image ? (
                        <img src={recipe.image} alt={recipe.title} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                          <ChefHat className="w-5 h-5 text-neutral-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{recipe?.title || 'Custom meal'}</p>
                        <p className="text-xs text-neutral-400 capitalize">{plan.meal_type} • {recipe?.calories || 0} kcal</p>
                      </div>
                      <button onClick={() => deletePlan(plan.id)} className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="font-semibold text-lg">Add to Meal Plan</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Recipe</label>
                <select value={newPlan.recipeId} onChange={e => setNewPlan(prev => ({ ...prev, recipeId: e.target.value }))} className="input-field">
                  <option value="">Select a recipe...</option>
                  {recipes.map(r => <option key={r.id} value={r.id}>{r.title} ({r.calories} kcal)</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Meal Type</label>
                <select value={newPlan.mealType} onChange={e => setNewPlan(prev => ({ ...prev, mealType: e.target.value }))} className="input-field">
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="snack">Snack</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Date</label>
                <input type="date" value={newPlan.date} onChange={e => setNewPlan(prev => ({ ...prev, date: e.target.value }))} className="input-field" />
              </div>
              <button onClick={addPlan} className="btn-primary w-full">Add to Plan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
