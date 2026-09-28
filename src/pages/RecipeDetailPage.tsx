import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Clock, Flame, ChefHat, Heart, Plus, ShoppingCart,
  CheckCircle, Loader2, Users
} from 'lucide-react';
import type { Recipe } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { AddToCaloriesModal } from '@/components/AddToCaloriesModal';
import { LoadingState, ErrorState } from '@/components/ui/States';

export function RecipeDetailPage() {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingGrocery, setAddingGrocery] = useState(false);

  useEffect(() => {
    async function fetchRecipe() {
      if (!recipeId) return;
      setLoading(true);
      const { data, error } = await supabase.from('recipes').select('*').eq('id', recipeId).maybeSingle();
      if (error || !data) {
        setError('Recipe not found');
        setLoading(false);
        return;
      }
      setRecipe(data as Recipe);
      setLoading(false);

      if (user) {
        const { data: fav } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('recipe_id', recipeId)
          .maybeSingle();
        setIsFavorite(!!fav);
      }
    }
    fetchRecipe();
  }, [recipeId, user]);

  async function toggleFavorite() {
    if (!user || !recipe) return;
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('recipe_id', recipe.id);
      setIsFavorite(false);
      showToast('Removed from favorites', 'info');
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, recipe_id: recipe.id });
      setIsFavorite(true);
      showToast('Added to favorites!', 'success');
    }
  }

  async function addToMealPlan() {
    if (!user || !recipe) return;
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

  async function addIngredientsToGrocery() {
    if (!user || !recipe) return;
    setAddingGrocery(true);
    const items = recipe.ingredients.map(ing => ({
      user_id: user.id,
      name: ing,
      quantity: '1',
      checked: false,
      category: 'recipe',
    }));
    const { error } = await supabase.from('grocery_list_items').insert(items);
    if (error) {
      showToast('Failed to add ingredients to grocery list', 'error');
    } else {
      showToast(`${recipe.ingredients.length} ingredients added to grocery list!`, 'success');
    }
    setAddingGrocery(false);
  }

  if (loading) return <LoadingState message="Loading recipe..." />;
  if (error || !recipe) return <ErrorState message={error || 'Recipe not found'} onRetry={() => navigate('/recipes')} />;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <Link to="/recipes" className="flex items-center gap-1 text-sm text-neutral-500 hover:text-green-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Recipes
      </Link>

      {/* Hero Image */}
      <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden">
        {recipe.image ? (
          <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <ChefHat className="w-16 h-16 text-neutral-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex gap-2 mb-2">
            <span className="badge badge-green backdrop-blur">{recipe.category}</span>
            {recipe.sub_category && (
              <span className="badge bg-white/20 text-white backdrop-blur capitalize">{recipe.sub_category.replace(/-/g, ' ')}</span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{recipe.title}</h1>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add to Calories
        </button>
        <button onClick={addToMealPlan} className="btn-secondary flex items-center gap-2">
          <ChefHat className="w-4 h-4" /> Add to Meal Plan
        </button>
        <button onClick={addIngredientsToGrocery} disabled={addingGrocery} className="btn-secondary flex items-center gap-2">
          {addingGrocery ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
          Add Ingredients to Grocery List
        </button>
        <button onClick={toggleFavorite} className={`btn-secondary flex items-center gap-2 ${isFavorite ? 'text-red-500' : ''}`}>
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500' : ''}`} /> {isFavorite ? 'Favorited' : 'Favorite'}
        </button>
      </div>

      {/* Description */}
      <div className="card">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{recipe.description}</p>
      </div>

      {/* Nutrition Info */}
      <div className="card">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">Nutrition Information</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center">
            <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-xs text-neutral-500">Calories</p>
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{recipe.calories}</p>
            <p className="text-xs text-neutral-400">kcal</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
            <p className="text-xs text-neutral-500">Protein</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{recipe.protein}g</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center">
            <p className="text-xs text-neutral-500">Carbs</p>
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{recipe.carbohydrates}g</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
            <p className="text-xs text-neutral-500">Fat</p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{recipe.fat}g</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
            <p className="text-xs text-neutral-500">Fiber</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{recipe.fiber}g</p>
          </div>
        </div>
      </div>

      {/* Meta Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card text-center">
          <Users className="w-5 h-5 text-neutral-400 mx-auto mb-1" />
          <p className="text-xs text-neutral-500">Serving Size</p>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{recipe.serving_size}</p>
        </div>
        <div className="card text-center">
          <Clock className="w-5 h-5 text-neutral-400 mx-auto mb-1" />
          <p className="text-xs text-neutral-500">Prep Time</p>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{recipe.preparation_time} min</p>
        </div>
        <div className="card text-center">
          <Clock className="w-5 h-5 text-neutral-400 mx-auto mb-1" />
          <p className="text-xs text-neutral-500">Cook Time</p>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{recipe.cooking_time} min</p>
        </div>
        <div className="card text-center">
          <ChefHat className="w-5 h-5 text-neutral-400 mx-auto mb-1" />
          <p className="text-xs text-neutral-500">Difficulty</p>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 capitalize">{recipe.difficulty}</p>
        </div>
      </div>

      {/* Ingredients & Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">Ingredients</h3>
          <ul className="space-y-2">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                {ing}
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">Instructions</h3>
          <ol className="space-y-3">
            {recipe.instructions.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Tags */}
      {recipe.tags && recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {recipe.tags.map((tag, i) => (
            <span key={i} className="badge bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 capitalize">
              {tag.replace(/-/g, ' ')}
            </span>
          ))}
        </div>
      )}

      <AddToCaloriesModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        foodName={recipe.title}
        calories={recipe.calories}
        protein={recipe.protein}
        carbs={recipe.carbohydrates}
        fat={recipe.fat}
        fiber={recipe.fiber}
        servingSize={recipe.serving_size}
        imageUrl={recipe.image}
        source="recipe"
      />
    </div>
  );
}
