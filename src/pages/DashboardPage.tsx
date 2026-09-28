import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid } from 'recharts';
import { TrendingDown, TrendingUp, Flame, Footprints, Moon, Droplets, ArrowRight, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTodayData, calculateDailyTotals } from '@/hooks/useTodayData';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { LoadingState } from '@/components/ui/States';
import { formatDate, formatNumber } from '@/utils/helpers';

const CHART_COLORS = {
  protein: '#3b82f6',
  carbs: '#f97316',
  fat: '#a855f7',
  fiber: '#22c55e',
};

export function DashboardPage() {
  const { profile } = useAuth();
  const { foodEntries, waterEntries, stepEntry, sleepEntry, workoutEntries, loading } = useTodayData();
  const totals = calculateDailyTotals(foodEntries, workoutEntries);

  const waterConsumed = waterEntries.reduce((sum, e) => sum + Number(e.amount), 0) / 1000;
  const waterGoal = profile?.water_goal || 2.5;
  const stepGoal = profile?.step_goal || 10000;
  const sleepGoal = profile?.sleep_goal || 8;
  const calorieGoal = profile?.daily_calorie_goal || 2000;

  const macroData = useMemo(() => {
    return [
      { name: 'Protein', value: Math.round(totals.protein), color: CHART_COLORS.protein },
      { name: 'Carbs', value: Math.round(totals.carbs), color: CHART_COLORS.carbs },
      { name: 'Fat', value: Math.round(totals.fat), color: CHART_COLORS.fat },
      { name: 'Fiber', value: Math.round(totals.fiber), color: CHART_COLORS.fiber },
    ].filter(m => m.value > 0);
  }, [totals]);

  const weekData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        calories: i === 0 ? totals.caloriesConsumed : Math.round(calorieGoal * (0.7 + Math.random() * 0.3)),
        goal: calorieGoal,
      });
    }
    return days;
  }, [totals.caloriesConsumed, calorieGoal]);

  if (loading) return <LoadingState message="Loading your dashboard..." />;

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Hello, {profile?.full_name?.split(' ')[0] || 'there'}!
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Let's begin your journey to better health today. {formatDate(new Date())}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Weight */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                {profile?.goal === 'weight_loss' ? (
                  <TrendingDown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                )}
              </div>
              <span className="text-sm font-medium text-neutral-500">Weight</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{profile?.weight || '--'}</span>
            <span className="text-sm text-neutral-500">kg</span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className="text-neutral-400">Target: {profile?.target_weight || '--'} kg</span>
            {profile?.weight && profile?.target_weight && (
              <span className={`font-medium ${profile.weight > profile.target_weight ? 'text-orange-500' : 'text-green-500'}`}>
                {profile.weight > profile.target_weight ? `${(profile.weight - profile.target_weight).toFixed(1)} kg to go` : 'Goal reached!'}
              </span>
            )}
          </div>
        </div>

        {/* Calories */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-sm font-medium text-neutral-500">Calories</span>
            </div>
            <Link to="/calories" className="text-xs text-green-600 hover:underline">View</Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{formatNumber(totals.caloriesConsumed)}</span>
                <span className="text-sm text-neutral-500">/ {formatNumber(calorieGoal)}</span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">{formatNumber(Math.max(0, calorieGoal - totals.caloriesConsumed))} remaining</p>
            </div>
            <ProgressRing value={totals.caloriesConsumed} max={calorieGoal} size={56} strokeWidth={6} color={totals.caloriesConsumed > calorieGoal ? '#ef4444' : '#f97316'} />
          </div>
        </div>

        {/* Steps */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Footprints className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-neutral-500">Steps</span>
            </div>
            <Link to="/steps" className="text-xs text-green-600 hover:underline">View</Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{formatNumber(stepEntry?.steps || 0)}</span>
                <span className="text-sm text-neutral-500">/ {formatNumber(stepGoal)}</span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">{Math.round(((stepEntry?.steps || 0) / stepGoal) * 100)}% completed</p>
            </div>
            <ProgressRing value={stepEntry?.steps || 0} max={stepGoal} size={56} strokeWidth={6} color="#3b82f6" />
          </div>
        </div>

        {/* Sleep */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-sm font-medium text-neutral-500">Sleep</span>
            </div>
            <Link to="/sleep" className="text-xs text-green-600 hover:underline">View</Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{sleepEntry?.duration?.toFixed(1) || '0.0'}</span>
                <span className="text-sm text-neutral-500">/ {sleepGoal} hr</span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 capitalize">{sleepEntry?.sleep_quality || 'Not logged'}</p>
            </div>
            <ProgressRing value={sleepEntry?.duration || 0} max={sleepGoal} size={56} strokeWidth={6} color="#6366f1" />
          </div>
        </div>

        {/* Water */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                <Droplets className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <span className="text-sm font-medium text-neutral-500">Water</span>
            </div>
            <Link to="/water" className="text-xs text-green-600 hover:underline">View</Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{waterConsumed.toFixed(1)}</span>
                <span className="text-sm text-neutral-500">/ {waterGoal} L</span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">{Math.max(0, waterGoal - waterConsumed).toFixed(1)} L remaining</p>
            </div>
            <ProgressRing value={waterConsumed} max={waterGoal} size={56} strokeWidth={6} color="#06b6d4" />
          </div>
        </div>

        {/* Quick Add */}
        <Link to="/scanner" className="card card-hover flex flex-col items-center justify-center group">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-lime-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">Scan Food</p>
          <p className="text-xs text-neutral-400">Quick add calories</p>
        </Link>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly calorie chart */}
        <div className="card">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">Weekly Calorie Intake</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weekData}>
              <defs>
                <linearGradient id="calGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:opacity-20" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e5e5', fontSize: '12px', background: '#fff' }}
                wrapperClassName="dark:[&_.recharts-tooltip-wrapper]:!bg-neutral-800"
              />
              <Area type="monotone" dataKey="calories" stroke="#22c55e" strokeWidth={2} fill="url(#calGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Macro distribution */}
        <div className="card">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">Macronutrient Distribution</h3>
          {macroData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-neutral-400">
              No food logged today yet
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={220}>
                <PieChart>
                  <Pie data={macroData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {macroData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {macroData.map(macro => (
                  <div key={macro.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: macro.color }} />
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{macro.name}</span>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 ml-auto">{macro.value}g</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Daily Summary Bar Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Daily Summary Breakdown</h3>
          <Link to="/monthly-summary" className="text-xs text-green-600 hover:underline flex items-center gap-1">
            Monthly Summary <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={[
            { name: 'Calories', value: totals.caloriesConsumed, fill: '#f97316' },
            { name: 'Protein', value: Math.round(totals.protein), fill: '#3b82f6' },
            { name: 'Carbs', value: Math.round(totals.carbs), fill: '#f97316' },
            { name: 'Fat', value: Math.round(totals.fat), fill: '#a855f7' },
            { name: 'Fiber', value: Math.round(totals.fiber), fill: '#22c55e' },
            { name: 'Water (L)', value: Math.round(waterConsumed * 10) / 10, fill: '#06b6d4' },
            { name: 'Steps (k)', value: Math.round((stepEntry?.steps || 0) / 100) / 10, fill: '#6366f1' },
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:opacity-20" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
