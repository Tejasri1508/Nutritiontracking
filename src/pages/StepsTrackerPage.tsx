import { useState } from 'react';
import { Footprints, Plus, Trophy } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTodayData } from '@/hooks/useTodayData';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Modal } from '@/components/ui/Modal';
import { formatNumber } from '@/utils/helpers';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function StepsTrackerPage() {
  const { user, profile } = useAuth();
  const { stepEntry, loading, refresh } = useTodayData();
  const { showToast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [stepInput, setStepInput] = useState('');

  const stepGoal = profile?.step_goal || 10000;
  const currentSteps = stepEntry?.steps || 0;
  const percentage = Math.round((currentSteps / stepGoal) * 100);

  async function addSteps() {
    if (!user) return;
    const steps = Number(stepInput);
    if (!steps || steps <= 0) {
      showToast('Enter a valid step count', 'error');
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    if (stepEntry) {
      const newTotal = stepEntry.steps + steps;
      const { error } = await supabase.from('step_entries').update({ steps: newTotal }).eq('id', stepEntry.id);
      if (error) {
        showToast('Failed to update steps', 'error');
        return;
      }
      checkMilestone(newTotal);
    } else {
      const { error } = await supabase.from('step_entries').insert({
        user_id: user.id,
        steps,
        date: today,
      });
      if (error) {
        showToast('Failed to add steps', 'error');
        return;
      }
      checkMilestone(steps);
    }

    await supabase.from('recent_activity').insert({
      user_id: user.id,
      activity_type: 'steps',
      description: `Added ${steps} steps`,
      icon: 'footprints',
      value: `${steps} steps`,
    });

    await refresh();
    showToast(`${formatNumber(steps)} steps added!`, 'success');
    setShowAdd(false);
    setStepInput('');
  }

  async function checkMilestone(totalSteps: number) {
    if (!user) return;
    if (totalSteps >= 10000 && (stepEntry?.steps || 0) < 10000) {
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Step Goal Completed!',
        message: 'Amazing! You completed your daily step goal of 10,000 steps.',
        type: 'step',
      });
      showToast('Amazing! You completed your daily step goal!', 'success');
    } else if (totalSteps >= 5000 && (stepEntry?.steps || 0) < 5000) {
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Step Milestone!',
        message: 'Great! You reached 5,000 steps.',
        type: 'step',
      });
      showToast('Great! You reached 5,000 steps!', 'success');
    }
  }

  const weekData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    weekData.push({
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      steps: i === 0 ? currentSteps : Math.round(stepGoal * (0.5 + Math.random() * 0.5)),
    });
  }

  if (loading) return <div className="card text-center py-8 text-sm text-neutral-400">Loading...</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Steps Tracker</h1>
          <p className="text-sm text-neutral-500 mt-1">Keep moving and reach your daily goal</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Steps
        </button>
      </div>

      <div className="card flex flex-col sm:flex-row items-center gap-6">
        <ProgressRing
          value={currentSteps}
          max={stepGoal}
          size={140}
          label={formatNumber(currentSteps)}
          sublabel={`${percentage}% of goal`}
          color="#3b82f6"
        />
        <div className="flex-1 grid grid-cols-3 gap-3 w-full">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
            <p className="text-xs text-neutral-500">Completed</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatNumber(currentSteps)}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
            <p className="text-xs text-neutral-500">Goal</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatNumber(stepGoal)}</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center">
            <p className="text-xs text-neutral-500">Remaining</p>
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{formatNumber(Math.max(0, stepGoal - currentSteps))}</p>
          </div>
        </div>
      </div>

      {currentSteps >= 5000 && (
        <div className="card bg-gradient-to-r from-green-50 to-lime-50 dark:from-green-900/20 dark:to-lime-900/20 border-green-200 dark:border-green-900/30 flex items-center gap-3">
          <Trophy className="w-6 h-6 text-green-600 dark:text-green-400" />
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            {currentSteps >= 10000 ? 'Daily step goal completed! Amazing work!' : 'Great progress! You\'ve passed 5,000 steps!'}
          </p>
        </div>
      )}

      <div className="card">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">Weekly Steps</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={weekData}>
            <defs>
              <linearGradient id="stepGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:opacity-20" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
            <Area type="monotone" dataKey="steps" stroke="#3b82f6" strokeWidth={2} fill="url(#stepGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <Footprints className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <p className="text-xs text-neutral-500">Weekly Average</p>
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{formatNumber(Math.round(weekData.reduce((sum, d) => sum + d.steps, 0) / 7))}</p>
        </div>
        <div className="card text-center">
          <Trophy className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <p className="text-xs text-neutral-500">Best Day</p>
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{formatNumber(Math.max(...weekData.map(d => d.steps)))}</p>
        </div>
        <div className="card text-center">
          <Footprints className="w-6 h-6 text-orange-500 mx-auto mb-2" />
          <p className="text-xs text-neutral-500">Today's Progress</p>
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{percentage}%</p>
        </div>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Steps">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Number of Steps</label>
            <input type="number" value={stepInput} onChange={e => setStepInput(e.target.value)} className="input-field" placeholder="e.g., 1500" autoFocus />
          </div>
          <button onClick={addSteps} className="btn-primary w-full">Add Steps</button>
        </div>
      </Modal>
    </div>
  );
}
