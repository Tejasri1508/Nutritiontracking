import { useState, useEffect } from 'react';
import { BarChart3, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Award } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { LoadingState } from '@/components/ui/States';
import { formatNumber } from '@/utils/helpers';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

export function MonthlySummaryPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [summary, setSummary] = useState({
    avgCalories: 0,
    totalCalories: 0,
    avgSteps: 0,
    totalSteps: 0,
    avgSleep: 0,
    avgWater: 0,
    totalWorkouts: 0,
    workoutCount: 0,
    goalCompletion: 0,
  });
  const [dailyData, setDailyData] = useState<{ day: string; calories: number; steps: number; water: number }[]>([]);

  useEffect(() => {
    async function fetchSummary() {
      if (!user) return;
      setLoading(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const [foodRes, stepRes, sleepRes, waterRes, workoutRes] = await Promise.all([
        supabase.from('food_entries').select('calories, date').eq('user_id', user.id).gte('date', startDate).lte('date', endDate),
        supabase.from('step_entries').select('steps, date').eq('user_id', user.id).gte('date', startDate).lte('date', endDate),
        supabase.from('sleep_entries').select('duration, date').eq('user_id', user.id).gte('date', startDate).lte('date', endDate),
        supabase.from('water_entries').select('amount, date').eq('user_id', user.id).gte('date', startDate).lte('date', endDate),
        supabase.from('workout_entries').select('id, calories_burned, date').eq('user_id', user.id).gte('date', startDate).lte('date', endDate),
      ]);

      const foodEntries = foodRes.data || [];
      const stepEntries = stepRes.data || [];
      const sleepEntries = sleepRes.data || [];
      const waterEntries = waterRes.data || [];
      const workoutEntries = workoutRes.data || [];

      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const today = new Date();
      const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
      const activeDays = isCurrentMonth ? today.getDate() : daysInMonth;

      const foodByDay: Record<string, number> = {};
      foodEntries.forEach((e: { calories: number; date: string }) => {
        foodByDay[e.date] = (foodByDay[e.date] || 0) + Number(e.calories);
      });

      const stepByDay: Record<string, number> = {};
      stepEntries.forEach((e: { steps: number; date: string }) => {
        stepByDay[e.date] = (stepByDay[e.date] || 0) + Number(e.steps);
      });

      const waterByDay: Record<string, number> = {};
      waterEntries.forEach((e: { amount: number; date: string }) => {
        waterByDay[e.date] = (waterByDay[e.date] || 0) + Number(e.amount);
      });

      const dailyArr: { day: string; calories: number; steps: number; water: number }[] = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        dailyArr.push({
          day: String(d),
          calories: Math.round(foodByDay[dateStr] || 0),
          steps: stepByDay[dateStr] || 0,
          water: Math.round((waterByDay[dateStr] || 0) / 100) / 10,
        });
      }
      setDailyData(dailyArr);

      const totalCalories = foodEntries.reduce((sum: number, e: { calories: number }) => sum + Number(e.calories), 0);
      const totalSteps = stepEntries.reduce((sum: number, e: { steps: number }) => sum + Number(e.steps), 0);
      const totalSleep = sleepEntries.reduce((sum: number, e: { duration: number }) => sum + Number(e.duration), 0);
      const totalWater = waterEntries.reduce((sum: number, e: { amount: number }) => sum + Number(e.amount), 0) / 1000;
      const totalWorkoutCalories = workoutEntries.reduce((sum: number, e: { calories_burned: number }) => sum + Number(e.calories_burned), 0);

      setSummary({
        avgCalories: Math.round(totalCalories / activeDays) || 0,
        totalCalories: Math.round(totalCalories),
        avgSteps: Math.round(totalSteps / activeDays) || 0,
        totalSteps: totalSteps,
        avgSleep: Math.round((totalSleep / activeDays) * 10) / 10 || 0,
        avgWater: Math.round((totalWater / activeDays) * 10) / 10 || 0,
        totalWorkouts: Math.round(totalWorkoutCalories),
        workoutCount: workoutEntries.length,
        goalCompletion: Math.min(100, Math.round(((totalCalories / activeDays) / 2000) * 100)),
      });
      setLoading(false);
    }
    fetchSummary();
  }, [user, currentMonth]);

  function prevMonth() { setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)); }
  function nextMonth() { setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)); }

  if (loading) return <LoadingState message="Loading monthly summary..." />;

  const cards = [
    { label: 'Avg Calories', value: formatNumber(summary.avgCalories), unit: 'kcal/day', color: 'orange', icon: TrendingUp },
    { label: 'Total Calories', value: formatNumber(summary.totalCalories), unit: 'kcal', color: 'red', icon: TrendingUp },
    { label: 'Avg Steps', value: formatNumber(summary.avgSteps), unit: 'steps/day', color: 'blue', icon: TrendingUp },
    { label: 'Total Steps', value: formatNumber(summary.totalSteps), unit: 'steps', color: 'indigo', icon: TrendingUp },
    { label: 'Avg Sleep', value: summary.avgSleep.toFixed(1), unit: 'hr/day', color: 'purple', icon: TrendingDown },
    { label: 'Avg Water', value: summary.avgWater.toFixed(1), unit: 'L/day', color: 'cyan', icon: TrendingDown },
    { label: 'Workouts', value: String(summary.workoutCount), unit: 'sessions', color: 'green', icon: Award },
    { label: 'Calories Burned', value: formatNumber(summary.totalWorkouts), unit: 'kcal', color: 'pink', icon: TrendingUp },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Monthly Summary</h1>
          <p className="text-sm text-neutral-500 mt-1">Your health overview for the month</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={nextMonth} className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="card">
            <div className="flex items-center gap-2 mb-2">
              <card.icon className="w-4 h-4 text-neutral-400" />
              <span className="text-xs font-medium text-neutral-500">{card.label}</span>
            </div>
            <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{card.value}</p>
            <p className="text-xs text-neutral-400">{card.unit}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-green-500" />
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Goal Completion</h3>
        </div>
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="30%" height={140}>
            <PieChart>
              <Pie data={[
                { name: 'Completed', value: summary.goalCompletion, fill: '#22c55e' },
                { name: 'Remaining', value: 100 - summary.goalCompletion, fill: '#e5e5e5' },
              ]} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2}>
                {[
                  <Cell key="1" fill="#22c55e" />,
                  <Cell key="2" fill="#e5e5e5" className="dark:opacity-20" />,
                ]}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{summary.goalCompletion}%</p>
            <p className="text-sm text-neutral-500">of daily calorie goal met on average</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">Daily Calorie Intake</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:opacity-20" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
            <Line type="monotone" dataKey="calories" stroke="#f97316" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">Daily Steps</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:opacity-20" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
            <Bar dataKey="steps" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
