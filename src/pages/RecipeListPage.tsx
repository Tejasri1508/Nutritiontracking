import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Clock, Flame, ChefHat, Plus, Heart, X } from 'lucide-react';
import type { Recipe } from '@/types';
import { AddToCaloriesModal } from '@/components/AddToCaloriesModal';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { LoadingState, EmptyState } from '@/components/ui/States';

interface RecipeListPageProps {
  category?: 'diet' | 'normal' | 'desserts';
  subCategory?: string;
  mealType?: string;
  title: string;
  subtitle?: string;
}

const calorieFilters = [
  { label: 'Under 300', min: 0, max: 300 },
  { label: '300–500', min: 300, max: 500 },
  { label: '500–700', min: 500, max: 700 },
  { label: '700+', min: 700, max: Infinity },
];

const mealTypeFilters = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const dietaryFilters = ['Vegetarian', 'Non-Vegetarian', 'Vegan'];
const prepTimeFilters = [
  { label: 'Under 15 min', max: 15 },
  { label: '15–30 min', max: 30 },
  { label: '30–60 min', max: 60 },
  { label: '60+ min', max: Infinity },
];

export function RecipeListPage({ category, subCategory, mealType, title, subtitle }: RecipeListPageProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCalorieFilter, setActiveCalorieFilter] = useState<number | null>(null);
  const [activeMealFilter, setActiveMealFilter] = useState<string | null>(null);
  const [activeDietaryFilter, setActiveDietaryFilter] = useState<string | null>(null);
  const [activePrepFilter, setActivePrepFilter] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [addToCaloriesRecipe, setAddToCaloriesRecipe] = useState<Recipe | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchRecipes() {
      setLoading(true);
      let query = supabase.from('recipes').select('*');
      if (category) query = query.eq('category', category);
      if (subCategory) query = query.eq('sub_category', subCategory);
      if (mealType) query = query.eq('meal_type', mealType);
      const { data } = await query.order('created_at', { ascending: true });
      setRecipes((data as Recipe[]) || []);
      setLoading(false);
    }
    fetchRecipes();
  }, [category, subCategory, mealType]);

  useEffect(() => {
    async function fetchFavorites() {
      if (!user) return;
      const { data } = await supabase.from('favorites').select('recipe_id').eq('user_id', user.id);
      if (data) {
        setFavorites(new Set(data.map(f => f.recipe_id as string)));
      }
    }
    fetchFavorites();
  }, [user]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      if (search) {
        const q = search.toLowerCase();
        const matchName = recipe.title.toLowerCase().includes(q);
        const matchDesc = recipe.description?.toLowerCase().includes(q);
        const matchIngredient = recipe.ingredients?.some(i => i.toLowerCase().includes(q));
        const matchTags = recipe.tags?.some(t => t.toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchIngredient && !matchTags) return false;
      }
      if (activeCalorieFilter !== null) {
        const f = calorieFilters[activeCalorieFilter];
        if (recipe.calories < f.min || recipe.calories >= f.max) return false;
      }
      if (activeMealFilter && recipe.meal_type !== activeMealFilter.toLowerCase()) return false;
      if (activeDietaryFilter && recipe.dietary_type !== activeDietaryFilter.toLowerCase().replace('-', '-')) return false;
      if (activePrepFilter !== null) {
        const f = prepTimeFilters[activePrepFilter];
        if (recipe.preparation_time > f.max) return false;
      }
      return true;
    });
  }, [recipes, search, activeCalorieFilter, activeMealFilter, activeDietaryFilter, activePrepFilter]);

  async function toggleFavorite(recipeId: string) {
    if (!user) return;
    if (favorites.has(recipeId)) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('recipe_id', recipeId);
      setFavorites(prev => {
        const next = new Set(prev);
        next.delete(recipeId);
        return next;
      });
      showToast('Removed from favorites', 'info');
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, recipe_id: recipeId });
      setFavorites(prev => new Set(prev).add(recipeId));
      showToast('Added to favorites!', 'success');
    }
  }

  const hasActiveFilters = activeCalorieFilter !== null || activeMealFilter || activeDietaryFilter || activePrepFilter !== null;

  function clearFilters() {
    setActiveCalorieFilter(null);
    setActiveMealFilter(null);
    setActiveDietaryFilter(null);
    setActivePrepFilter(null);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{title}</h1>
        {subtitle && <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{subtitle}</p>}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search recipes, ingredients, cuisine..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary flex items-center gap-2 ${hasActiveFilters ? 'border-green-500 text-green-600' : ''}`}
        >
          <Filter className="w-4 h-4" /> Filters
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-green-500" />}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="card animate-expand space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Filters</h3>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-neutral-500 mb-2">Calories</p>
            <div className="flex flex-wrap gap-2">
              {calorieFilters.map((f, i) => (
                <button
                  key={i}
                  onClick={() => setActiveCalorieFilter(activeCalorieFilter === i ? null : i)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    activeCalorieFilter === i
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-neutral-500 mb-2">Meal Type</p>
            <div className="flex flex-wrap gap-2">
              {mealTypeFilters.map(f => (
                <button
                  key={f}
                  onClick={() => setActiveMealFilter(activeMealFilter === f ? null : f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    activeMealFilter === f
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-neutral-500 mb-2">Dietary Type</p>
            <div className="flex flex-wrap gap-2">
              {dietaryFilters.map(f => (
                <button
                  key={f}
                  onClick={() => setActiveDietaryFilter(activeDietaryFilter === f ? null : f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    activeDietaryFilter === f
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-neutral-500 mb-2">Preparation Time</p>
            <div className="flex flex-wrap gap-2">
              {prepTimeFilters.map((f, i) => (
                <button
                  key={i}
                  onClick={() => setActivePrepFilter(activePrepFilter === i ? null : i)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    activePrepFilter === i
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-neutral-500">
        {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} found
      </p>

      {/* Recipe Grid */}
      {loading ? (
        <LoadingState message="Loading recipes..." />
      ) : filteredRecipes.length === 0 ? (
        <EmptyState
          icon={<ChefHat className="w-12 h-12" />}
          title="No recipes found"
          description="Try adjusting your search or filters to find more recipes."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isFavorite={favorites.has(recipe.id)}
              onToggleFavorite={() => toggleFavorite(recipe.id)}
              onAddToCalories={() => setAddToCaloriesRecipe(recipe)}
            />
          ))}
        </div>
      )}

      {/* Add to Calories Modal */}
      {addToCaloriesRecipe && (
        <AddToCaloriesModal
          open={!!addToCaloriesRecipe}
          onClose={() => setAddToCaloriesRecipe(null)}
          foodName={addToCaloriesRecipe.title}
          calories={addToCaloriesRecipe.calories}
          protein={addToCaloriesRecipe.protein}
          carbs={addToCaloriesRecipe.carbohydrates}
          fat={addToCaloriesRecipe.fat}
          fiber={addToCaloriesRecipe.fiber}
          servingSize={addToCaloriesRecipe.serving_size}
          imageUrl={addToCaloriesRecipe.image}
          source="recipe"
        />
      )}
    </div>
  );
}

interface RecipeCardProps {
  recipe: Recipe;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAddToCalories: () => void;
}

function RecipeCard({ recipe, isFavorite, onToggleFavorite, onAddToCalories }: RecipeCardProps) {
  const { showToast } = useToast();
  const { user } = useAuth();

  async function addToMealPlan() {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('meal_plans').insert({
      user_id: user.id,
      recipe_id: recipe.id,
      meal_type: recipe.meal_type,
      date: today,
      servings: 1,
    });
    if (error) {
      showToast('Failed to add to meal plan', 'error');
    } else {
      showToast(`${recipe.title} added to your meal plan!`, 'success');
    }
  }

  return (
    <div className="card card-hover overflow-hidden p-0 flex flex-col group">
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        {recipe.image ? (
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <ChefHat className="w-10 h-10 text-neutral-300" />
          </div>
        )}
        <button
          onClick={onToggleFavorite}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-neutral-400'}`} />
        </button>
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <span className="badge badge-green backdrop-blur bg-white/90 dark:bg-neutral-900/90">
            <Flame className="w-3 h-3" /> {recipe.calories} kcal
          </span>
          <span className="badge bg-white/90 dark:bg-neutral-900/90 text-neutral-600 dark:text-neutral-300 backdrop-blur">
            <Clock className="w-3 h-3" /> {recipe.preparation_time} min
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">{recipe.title}</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mb-3">{recipe.description}</p>

        {/* Macros */}
        <div className="grid grid-cols-4 gap-1.5 mb-3 text-center">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-1.5">
            <p className="text-[10px] text-neutral-500">Protein</p>
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">{recipe.protein}g</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-1.5">
            <p className="text-[10px] text-neutral-500">Carbs</p>
            <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">{recipe.carbohydrates}g</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-1.5">
            <p className="text-[10px] text-neutral-500">Fat</p>
            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">{recipe.fat}g</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-1.5">
            <p className="text-[10px] text-neutral-500">Fiber</p>
            <p className="text-xs font-semibold text-green-600 dark:text-green-400">{recipe.fiber}g</p>
          </div>
        </div>

        {/* Serving & Difficulty */}
        <div className="flex items-center gap-3 text-xs text-neutral-500 mb-3">
          <span>Serving: {recipe.serving_size}</span>
          <span className="capitalize">• {recipe.difficulty}</span>
        </div>

        {/* Buttons */}
        <div className="mt-auto space-y-2">
          <button onClick={onAddToCalories} className="btn-primary w-full text-sm py-2 flex items-center justify-center gap-1.5">
            <Plus className="w-4 h-4" /> Add to Calories
          </button>
          <div className="flex gap-2">
            <Link
              to={`/recipes/${recipe.id}`}
              className="btn-secondary flex-1 text-xs py-2 text-center"
            >
              View Recipe
            </Link>
            <button onClick={addToMealPlan} className="btn-secondary text-xs py-2 px-3">
              Meal Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
