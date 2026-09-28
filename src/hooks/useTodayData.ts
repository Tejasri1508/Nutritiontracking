import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { FoodEntry, WaterEntry, StepEntry, SleepEntry, WorkoutEntry, RecentActivity } from '@/types';

export interface TodayData {
  foodEntries: FoodEntry[];
  waterEntries: WaterEntry[];
  stepEntry: StepEntry | null;
  sleepEntry: SleepEntry | null;
  workoutEntries: WorkoutEntry[];
  recentActivity: RecentActivity[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useTodayData(): TodayData {
  const { user } = useAuth();
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [waterEntries, setWaterEntries] = useState<WaterEntry[]>([]);
  const [stepEntry, setStepEntry] = useState<StepEntry | null>(null);
  const [sleepEntry, setSleepEntry] = useState<SleepEntry | null>(null);
  const [workoutEntries, setWorkoutEntries] = useState<WorkoutEntry[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];

    const [foodRes, waterRes, stepRes, sleepRes, workoutRes, activityRes] = await Promise.all([
      supabase.from('food_entries').select('*').eq('user_id', user.id).eq('date', today).order('created_at', { ascending: false }),
      supabase.from('water_entries').select('*').eq('user_id', user.id).eq('date', today).order('created_at', { ascending: false }),
      supabase.from('step_entries').select('*').eq('user_id', user.id).eq('date', today).maybeSingle(),
      supabase.from('sleep_entries').select('*').eq('user_id', user.id).eq('date', today).maybeSingle(),
      supabase.from('workout_entries').select('*').eq('user_id', user.id).eq('date', today).order('created_at', { ascending: false }),
      supabase.from('recent_activity').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    ]);

    setFoodEntries((foodRes.data as FoodEntry[]) || []);
    setWaterEntries((waterRes.data as WaterEntry[]) || []);
    setStepEntry((stepRes.data as StepEntry) || null);
    setSleepEntry((sleepRes.data as SleepEntry) || null);
    setWorkoutEntries((workoutRes.data as WorkoutEntry[]) || []);
    setRecentActivity((activityRes.data as RecentActivity[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { foodEntries, waterEntries, stepEntry, sleepEntry, workoutEntries, recentActivity, loading, refresh };
}

export function calculateDailyTotals(foodEntries: FoodEntry[], workoutEntries: WorkoutEntry[]) {
  const caloriesConsumed = foodEntries.reduce((sum, e) => sum + Number(e.calories), 0);
  const caloriesBurned = workoutEntries.reduce((sum, e) => sum + Number(e.calories_burned), 0);
  const protein = foodEntries.reduce((sum, e) => sum + Number(e.protein), 0);
  const carbs = foodEntries.reduce((sum, e) => sum + Number(e.carbohydrates), 0);
  const fat = foodEntries.reduce((sum, e) => sum + Number(e.fat), 0);
  const fiber = foodEntries.reduce((sum, e) => sum + Number(e.fiber), 0);

  return { caloriesConsumed, caloriesBurned, protein, carbs, fat, fiber };
}
