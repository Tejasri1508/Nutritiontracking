import { useEffect, useState } from 'react';
import { Lightbulb, TrendingUp, TrendingDown, Minus, Moon, Droplets, Footprints, Dumbbell, Flame } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { LoadingState } from '@/components/ui/States';

interface Insight {
  icon: typeof TrendingUp;
  title: string;
  description: string;
  trend: 'up' | 'down' | 'neutral';
  color: string;
}

export function HealthInsightsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    async function fetchInsights() {
      if (!user) return;
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0];
      const twoWeeksAgo = new Date(today.getTime() - 14 * 86400000).toISOString().split('T')[0];
      const weekAgoDate = new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];

      const [thisWeekFood, lastWeekFood, thisWeekSleep, thisWeekSteps, thisWeekWater, thisWeekWorkouts] = await Promise.all([
        supabase.from('food_entries').select('calories, date').eq('user_id', user.id).gte('date', weekAgo).lte('date', todayStr),
        supabase.from('food_entries').select('calories, date').eq('user_id', user.id).gte('date', twoWeeksAgo).lt('date', weekAgoDate),
        supabase.from('sleep_entries').select('duration, date').eq('user_id', user.id).gte('date', weekAgo).lte('date', todayStr),
        supabase.from('step_entries').select('steps, date').eq('user_id', user.id).gte('date', weekAgo).lte('date', todayStr),
        supabase.from('water_entries').select('amount, date').eq('user_id', user.id).gte('date', weekAgo).lte('date', todayStr),
        supabase.from('workout_entries').select('id, date').eq('user_id', user.id).gte('date', weekAgo).lte('date', todayStr),
      ]);

      const thisWeekCalories = (thisWeekFood.data || []).reduce((s: number, e: { calories: number }) => s + Number(e.calories), 0);
      const lastWeekCalories = (lastWeekFood.data || []).reduce((s: number, e: { calories: number }) => s + Number(e.calories), 0);
      const avgCalories = Math.round(thisWeekCalories / 7);
      const lastWeekAvg = Math.round(lastWeekCalories / 7);

      const sleepEntries = thisWeekSleep.data || [];
      const avgSleep = sleepEntries.length > 0 ? (sleepEntries.reduce((s: number, e: { duration: number }) => s + Number(e.duration), 0) / sleepEntries.length).toFixed(1) : '0';

      const stepEntries = thisWeekSteps.data || [];
      const avgSteps = stepEntries.length > 0 ? Math.round(stepEntries.reduce((s: number, e: { steps: number }) => s + Number(e.steps), 0) / stepEntries.length) : 0;

      const waterEntries = thisWeekWater.data || [];
      const totalWater = (waterEntries.reduce((s: number, e: { amount: number }) => s + Number(e.amount), 0) / 1000).toFixed(1);

      const workoutCount = (thisWeekWorkouts.data || []).length;

      const newInsights: Insight[] = [];

      if (avgCalories > 0) {
        const trend = lastWeekAvg > 0 ? (avgCalories > lastWeekAvg ? 'up' : avgCalories < lastWeekAvg ? 'down' : 'neutral') : 'neutral';
        newInsights.push({
          icon: Flame,
          title: 'Calorie Intake',
          description: `You averaged ${avgCalories} kcal per day this week. ${lastWeekAvg > 0 ? (trend === 'up' ? `That's ${avgCalories - lastWeekAvg} kcal more than last week.` : trend === 'down' ? `That's ${lastWeekAvg - avgCalories} kcal less than last week.` : 'Similar to last week.') : 'Keep tracking to see trends!'}`,
          trend,
          color: 'orange',
        });
      }

      if (Number(avgSleep) > 0) {
        newInsights.push({
          icon: Moon,
          title: 'Sleep Pattern',
          description: `You averaged ${avgSleep} hours of sleep this week. ${Number(avgSleep) >= 7 ? 'Great job maintaining healthy sleep habits!' : 'Try to get at least 7-8 hours for optimal wellness.'}`,
          trend: Number(avgSleep) >= 7 ? 'up' : 'down',
          color: 'indigo',
        });
      }

      if (avgSteps > 0) {
        newInsights.push({
          icon: Footprints,
          title: 'Step Activity',
          description: `You averaged ${avgSteps.toLocaleString()} steps per day this week. ${avgSteps >= 8000 ? 'Excellent! You\'re staying very active.' : avgSteps >= 5000 ? 'Good progress! Try to reach 8,000 steps for better health.' : 'Consider taking more walks to increase your daily steps.'}`,
          trend: avgSteps >= 7000 ? 'up' : 'down',
          color: 'blue',
        });
      }

      newInsights.push({
        icon: Droplets,
        title: 'Water Intake',
        description: `You drank ${totalWater}L of water this week. ${Number(totalWater) >= 15 ? 'Excellent hydration!' : 'Try to drink more water throughout the day.'}`,
        trend: Number(totalWater) >= 15 ? 'up' : 'down',
        color: 'cyan',
      });

      newInsights.push({
        icon: Dumbbell,
        title: 'Workout Activity',
        description: `You completed ${workoutCount} workout${workoutCount !== 1 ? 's' : ''} this week. ${workoutCount >= 4 ? 'Amazing consistency! Keep up the great work.' : workoutCount >= 2 ? 'Good start! Aim for 3-4 workouts per week.' : 'Try to fit in more workouts for better results.'}`,
        trend: workoutCount >= 3 ? 'up' : 'down',
        color: 'green',
      });

      setInsights(newInsights);
      setLoading(false);
    }
    fetchInsights();
  }, [user]);

  if (loading) return <LoadingState message="Analyzing your health data..." />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Health Insights</h1>
        <p className="text-sm text-neutral-500 mt-1">Wellness insights based on your tracked data</p>
      </div>

      <div className="card bg-gradient-to-r from-green-50 to-lime-50 dark:from-green-900/20 dark:to-lime-900/20 border-green-200 dark:border-green-900/30">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700 dark:text-green-400">
            These insights are generated from your tracked data and are for wellness purposes only. They are not medical advice or diagnoses.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {insights.map((insight, i) => (
          <div key={i} className="card card-hover">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl bg-${insight.color}-100 dark:bg-${insight.color}-900/30 flex items-center justify-center flex-shrink-0`}>
                <insight.icon className={`w-5 h-5 text-${insight.color}-600 dark:text-${insight.color}-400`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{insight.title}</h3>
                  {insight.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                  {insight.trend === 'down' && <TrendingDown className="w-4 h-4 text-orange-500" />}
                  {insight.trend === 'neutral' && <Minus className="w-4 h-4 text-neutral-400" />}
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{insight.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
