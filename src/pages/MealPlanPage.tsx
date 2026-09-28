import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Trash2, ChefHat, Calendar, Sparkles, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { LoadingState, EmptyState } from '@/components/ui/States';
import type { MealPlan, Recipe } from '@/types';

export function MealPlanPage() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [newPlan, setNewPlan] = useState({ recipeId: '', mealType: 'breakfast', date: new Date().toISOString().split('T')[0] });
  const [genPrefs, setGenPrefs] = useState({
    date: new Date().toISOString().split('T')[0],
    dietaryType: 'vegetarian',
    calorieGoal: profile?.daily_calorie_goal || 2000,
  });

  useEffect(() => {
    setGenPrefs(prev => ({ ...prev, calorieGoal: profile?.daily_calorie_goal || 2000 }));
  }, [profile]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      const [planRes, recipeRes] = await Promise.all([
        supabase.from('meal_plans').select('*').eq('user_id', user.id).order('date', { ascending: true }),
        supabase.from('recipes').select('*').limit(100),
      ]);
      setMealPlans((planRes.data as MealPlan[]) || []);
      setRecipes((recipeRes.data as Recipe[]) || []);
      setLoading(false);
    }
    fetchData();
  }, [user]);

  async function refreshPlans() {
    if (!user) return;
    const { data } = await supabase.from('meal_plans').select('*').eq('user_id', user.id).order('date', { ascending: true });
    setMealPlans((data as MealPlan[]) || []);
  }

  async function addPlan() {
    if (!user || !newPlan.recipeId) {
      showToast('Please select a recipe', 'error');
      return;
    }
    const recipe = recipes.find(r => r.id === newPlan.recipeId);
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
    showToast(`${recipe?.title || 'Recipe'} added to meal plan!`, 'success');
    setShowAdd(false);
    await refreshPlans();
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

  async function generateMealPlan() {
    if (!user) return;
    setGenerating(true);

    const targetCalories = genPrefs.calorieGoal || 2000;
    const mealTargets = [
      { type: 'breakfast', target: Math.round(targetCalories * 0.25) },
      { type: 'lunch', target: Math.round(targetCalories * 0.35) },
      { type: 'snack', target: Math.round(targetCalories * 0.10) },
      { type: 'dinner', target: Math.round(targetCalories * 0.30) },
    ];

    const filteredRecipes = recipes.filter(r => {
      if (genPrefs.dietaryType === 'vegan') return r.dietary_type === 'vegan';
      if (genPrefs.dietaryType === 'vegetarian') return r.dietary_type === 'vegetarian' || r.dietary_type === 'vegan';
      return true;
    });

    const selected: { recipe: Recipe; mealType: string }[] = [];
    for (const meal of mealTargets) {
      const candidates = filteredRecipes
        .filter(r => r.meal_type === meal.type)
        .map(r => ({ r, diff: Math.abs(r.calories - meal.target) }))
        .sort((a, b) => a.diff - b.diff)
        .slice(0, 5);

      if (candidates.length > 0) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        if (!selected.find(s => s.recipe.id === pick.r.id)) {
          selected.push({ recipe: pick.r, mealType: meal.type });
        }
      }
    }

    if (selected.length === 0) {
      showToast('No suitable recipes found for your preferences', 'error');
      setGenerating(false);
      return;
    }

    const inserts = selected.map(s => ({
      user_id: user.id,
      recipe_id: s.recipe.id,
      meal_type: s.mealType,
      date: genPrefs.date,
      servings: 1,
    }));

    const { error } = await supabase.from('meal_plans').insert(inserts);
    if (error) {
      showToast('Failed to generate meal plan', 'error');
      setGenerating(false);
      return;
    }

    const totalCalories = selected.reduce((sum, s) => sum + s.recipe.calories, 0);
    showToast(`Meal plan generated! ${selected.length} meals, ${totalCalories} kcal total`, 'success');
    setGenerating(false);
    await refreshPlans();
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
          <p className="text-sm text-neutral-500 mt-1">Plan your meals ahead or auto-generate a balanced plan</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Meal
        </button>
      </div>

      {/* Auto-generate meal plan */}
      <div className="card bg-gradient-to-br from-green-50 to-lime-50 dark:from-green-900/20 dark:to-lime-900/20 border-green-200 dark:border-green-900/30">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h3 className="text-sm font-semibold text-green-700 dark:text-green-400">Auto-Generate Meal Plan</h3>
        </div>
        <p className="text-xs text-green-600 dark:text-green-500 mb-4">
          Generate a balanced daily meal plan based on your calorie goal and dietary preferences. The system picks recipes closest to each meal's target calories.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Date</label>
            <input
              type="date"
              value={genPrefs.date}
              onChange={e => setGenPrefs(prev => ({ ...prev, date: e.target.value }))}
              className="input-field text-sm bg-white dark:bg-neutral-900"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Dietary Type</label>
            <select
              value={genPrefs.dietaryType}
              onChange={e => setGenPrefs(prev => ({ ...prev, dietaryType: e.target.value }))}
              className="input-field text-sm bg-white dark:bg-neutral-900"
            >
              <option value="vegetarian">Vegetarian</option>
              <option value="non-vegetarian">Non-Vegetarian</option>
              <option value="vegan">Vegan</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Calorie Goal</label>
            <input
              type="number"
              value={genPrefs.calorieGoal}
              onChange={e => setGenPrefs(prev => ({ ...prev, calorieGoal: Number(e.target.value) }))}
              className="input-field text-sm bg-white dark:bg-neutral-900"
            />
          </div>
        </div>
        <button
          onClick={generateMealPlan}
          disabled={generating}
          className="btn-primary flex items-center justify-center gap-2 w-full"
        >
          {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Meal Plan</>}
        </button>
      </div>

      {/* Existing meal plans */}
      {Object.keys(groupedByDate).length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-12 h-12" />}
          title="No meals planned yet"
          description="Add recipes manually or use the auto-generator above to create a balanced meal plan."
          action={<button onClick={() => setShowAdd(true)} className="btn-primary">Add Your First Meal</button>}
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, plans]) => {
            const totalCalories = plans.reduce((sum, plan) => {
              const recipe = recipes.find(r => r.id === plan.recipe_id);
              return sum + (recipe?.calories || 0);
            }, 0);
            return (
              <div key={date} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-500" />
                    <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </h3>
                  </div>
                  <span className="badge badge-green">{totalCalories} kcal total</span>
                </div>
                <div className="space-y-2">
                  {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map(mealType => {
                    const mealPlans = plans.filter(p => p.meal_type === mealType);
                    if (mealPlans.length === 0) return null;
                    return (
                      <div key={mealType}>
                        <p className="text-xs font-medium text-neutral-400 capitalize mb-1">{mealType}</p>
                        {mealPlans.map(plan => {
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
                                <Link to={`/recipes/${recipe?.id}`} className="text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-green-600 transition-colors">
                                  {recipe?.title || 'Custom meal'}
                                </Link>
                                <p className="text-xs text-neutral-400">{recipe?.calories || 0} kcal • {recipe?.protein || 0}g protein</p>
                              </div>
                              <button onClick={() => deletePlan(plan.id)} className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
