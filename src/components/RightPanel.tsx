import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Utensils, Droplets, Footprints, Moon, Dumbbell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTodayData, calculateDailyTotals } from '@/hooks/useTodayData';
import { supabase } from '@/lib/supabase';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { formatNumber, formatTimeAgo } from '@/utils/helpers';
import type { RecentActivity } from '@/types';

const activityIcons: Record<string, typeof Utensils> = {
  food: Utensils,
  water: Droplets,
  steps: Footprints,
  sleep: Moon,
  workout: Dumbbell,
};

export function RightPanel() {
  const { profile } = useAuth();
  const { foodEntries, waterEntries, stepEntry, sleepEntry, workoutEntries, recentActivity, loading } = useTodayData();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const totals = calculateDailyTotals(foodEntries, workoutEntries);
  const waterConsumed = waterEntries.reduce((sum, e) => sum + Number(e.amount), 0) / 1000;
  const calorieGoal = profile?.daily_calorie_goal || 2000;

  const meals = {
    breakfast: foodEntries.filter(e => e.meal_type === 'breakfast'),
    lunch: foodEntries.filter(e => e.meal_type === 'lunch'),
    snack: foodEntries.filter(e => e.meal_type === 'snack'),
    dinner: foodEntries.filter(e => e.meal_type === 'dinner'),
  };

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const today = new Date().toDateString();

  function prevMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }
  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }

  return (
    <div className="space-y-4">
      {/* Calorie summary ring */}
      <div className="card flex flex-col items-center">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 self-start mb-3">Today's Calories</h3>
        <ProgressRing
          value={totals.caloriesConsumed}
          max={calorieGoal}
          size={140}
          label={formatNumber(totals.caloriesConsumed)}
          sublabel={`of ${formatNumber(calorieGoal)} kcal`}
          color={totals.caloriesConsumed > calorieGoal ? '#ef4444' : '#22c55e'}
        />
        <div className="grid grid-cols-2 gap-2 w-full mt-4">
          <div className="text-center bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2">
            <p className="text-xs text-neutral-500">Consumed</p>
            <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">{formatNumber(totals.caloriesConsumed)}</p>
          </div>
          <div className="text-center bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
            <p className="text-xs text-neutral-500">Remaining</p>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">{formatNumber(Math.max(0, calorieGoal - totals.caloriesConsumed))}</p>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" /> Calendar
          </h3>
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <ChevronLeft className="w-4 h-4 text-neutral-500" />
            </button>
            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300 min-w-[80px] text-center">
              {currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
            <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-center text-xs text-neutral-400 font-medium py-1">{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
            const isToday = date.toDateString() === today;
            const isSelected = date.toDateString() === selectedDate.toDateString();
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(date)}
                className={`aspect-square rounded-lg text-xs font-medium transition-all ${
                  isToday
                    ? 'bg-green-600 text-white'
                    : isSelected
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        {selectedDate.toDateString() === today && (
          <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-neutral-500">Calories</span><span className="font-medium">{formatNumber(totals.caloriesConsumed)} kcal</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Water</span><span className="font-medium">{waterConsumed.toFixed(1)} L</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Steps</span><span className="font-medium">{formatNumber(stepEntry?.steps || 0)}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Sleep</span><span className="font-medium">{sleepEntry?.duration?.toFixed(1) || 0} hr</span></div>
          </div>
        )}
      </div>

      {/* Today's Meals */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Today's Meals</h3>
          <Link to="/calories" className="text-xs text-green-600 hover:underline flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add Meal
          </Link>
        </div>
        <div className="space-y-3">
          {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map(mealType => (
            <div key={mealType}>
              <p className="text-xs font-medium text-neutral-400 capitalize mb-1">{mealType}</p>
              {meals[mealType].length === 0 ? (
                <p className="text-xs text-neutral-300 dark:text-neutral-700 italic">No items logged</p>
              ) : (
                meals[mealType].map(entry => (
                  <div key={entry.id} className="flex items-center gap-2 py-1">
                    {entry.image_url ? (
                      <img src={entry.image_url} alt={entry.food_name} className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                        <Utensils className="w-4 h-4 text-neutral-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">{entry.food_name}</p>
                      <p className="text-xs text-neutral-400">{entry.calories} kcal</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">Recent Activity</h3>
        {loading ? (
          <p className="text-xs text-neutral-400">Loading...</p>
        ) : recentActivity.length === 0 ? (
          <p className="text-xs text-neutral-400 italic">No recent activity</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.slice(0, 6).map(activity => {
              const Icon = activityIcons[activity.activity_type] || Utensils;
              return (
                <div key={activity.id} className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-700 dark:text-neutral-300">{activity.description}</p>
                    <p className="text-xs text-neutral-400">{formatTimeAgo(activity.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
