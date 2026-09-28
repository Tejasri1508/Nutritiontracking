import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { FoodScannerPage } from '@/pages/FoodScannerPage';
import { CaloriesPage } from '@/pages/CaloriesPage';
import { WaterTrackerPage } from '@/pages/WaterTrackerPage';
import { StepsTrackerPage } from '@/pages/StepsTrackerPage';
import { SleepTrackerPage } from '@/pages/SleepTrackerPage';
import { WorkoutsPage } from '@/pages/WorkoutsPage';
import { MealPlanPage } from '@/pages/MealPlanPage';
import { GroceryListPage } from '@/pages/GroceryListPage';
import { MonthlySummaryPage } from '@/pages/MonthlySummaryPage';
import { HealthInsightsPage } from '@/pages/HealthInsightsPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { RecipeListPage } from '@/pages/RecipeListPage';
import { RecipeDetailPage } from '@/pages/RecipeDetailPage';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }
  if (session) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/scanner" element={<ProtectedRoute><FoodScannerPage /></ProtectedRoute>} />
      <Route path="/calories" element={<ProtectedRoute><CaloriesPage /></ProtectedRoute>} />
      <Route path="/water" element={<ProtectedRoute><WaterTrackerPage /></ProtectedRoute>} />
      <Route path="/steps" element={<ProtectedRoute><StepsTrackerPage /></ProtectedRoute>} />
      <Route path="/sleep" element={<ProtectedRoute><SleepTrackerPage /></ProtectedRoute>} />
      <Route path="/workouts" element={<ProtectedRoute><WorkoutsPage /></ProtectedRoute>} />
      <Route path="/meal-plan" element={<ProtectedRoute><MealPlanPage /></ProtectedRoute>} />
      <Route path="/grocery-list" element={<ProtectedRoute><GroceryListPage /></ProtectedRoute>} />
      <Route path="/monthly-summary" element={<ProtectedRoute><MonthlySummaryPage /></ProtectedRoute>} />
      <Route path="/health-insights" element={<ProtectedRoute><HealthInsightsPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

      {/* Recipes */}
      <Route path="/recipes" element={<ProtectedRoute><RecipeListPage title="All Recipes" subtitle="Browse our complete collection of recipes" /></ProtectedRoute>} />
      <Route path="/recipes/diet" element={<ProtectedRoute><RecipeListPage category="diet" title="Diet Recipes" subtitle="Healthy recipes for your diet goals" /></ProtectedRoute>} />
      <Route path="/recipes/diet/weight-loss" element={<ProtectedRoute><RecipeListPage category="diet" subCategory="weight-loss" title="Weight Loss Recipes" subtitle="Low-calorie recipes to support your weight loss journey" /></ProtectedRoute>} />
      <Route path="/recipes/diet/weight-gain" element={<ProtectedRoute><RecipeListPage category="diet" subCategory="weight-gain" title="Weight Gain Recipes" subtitle="High-calorie recipes for healthy weight gain" /></ProtectedRoute>} />
      <Route path="/recipes/normal" element={<ProtectedRoute><RecipeListPage category="normal" title="Normal Recipes" subtitle="Everyday recipes for all occasions" /></ProtectedRoute>} />
      <Route path="/recipes/breakfast" element={<ProtectedRoute><RecipeListPage mealType="breakfast" title="Breakfast Recipes" subtitle="Start your day with a healthy meal" /></ProtectedRoute>} />
      <Route path="/recipes/lunch" element={<ProtectedRoute><RecipeListPage mealType="lunch" title="Lunch Recipes" subtitle="Midday meals to keep you going" /></ProtectedRoute>} />
      <Route path="/recipes/dinner" element={<ProtectedRoute><RecipeListPage mealType="dinner" title="Dinner Recipes" subtitle="Complete meals for the end of the day" /></ProtectedRoute>} />
      <Route path="/recipes/beverages" element={<ProtectedRoute><RecipeListPage subCategory="beverages" title="Beverages" subtitle="Healthy drinks and refreshing beverages" /></ProtectedRoute>} />
      <Route path="/recipes/desserts" element={<ProtectedRoute><RecipeListPage category="desserts" title="Desserts" subtitle="Sweet treats and dessert recipes" /></ProtectedRoute>} />
      <Route path="/recipes/:recipeId" element={<ProtectedRoute><RecipeDetailPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
