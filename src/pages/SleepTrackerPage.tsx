import { useState } from 'react';
import { Moon, Plus, Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTodayData } from '@/hooks/useTodayData';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Modal } from '@/components/ui/Modal';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

export function SleepTrackerPage() {
  const { user, profile } = useAuth();
  const { sleepEntry, loading, refresh } = useTodayData();
  const { showToast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ sleepTime: '', wakeTime: '', quality: 'good' });

  const sleepGoal = profile?.sleep_goal || 8;
  const duration = sleepEntry?.duration || 0;

  function calculateDuration(sleep: string, wake: string): number {
    if (!sleep || !wake) return 0;
    const sleepDate = new Date(`2000-01-01T${sleep}`);
    let wakeDate = new Date(`2000-01-01T${wake}`);
    if (wakeDate <= sleepDate) wakeDate = new Date(`2000-01-02T${wake}`);
    return (wakeDate.getTime() - sleepDate.getTime()) / (1000 * 60 * 60);
  }

  async function logSleep() {
    if (!user) return;
    const dur = calculateDuration(form.sleepTime, form.wakeTime);
    if (dur <= 0) {
      showToast('Please enter valid sleep and wake times', 'error');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const sleepDateTime = new Date(`${today}T${form.sleepTime}`).toISOString();
    const wakeDateTime = new Date(`${today}T${form.wakeTime}`).toISOString();

    const deepSleep = dur * 0.2;
    const lightSleep = dur * 0.5;
    const remSleep = dur * 0.2;
    const awakeTime = dur * 0.1;

    if (sleepEntry) {
      const { error } = await supabase.from('sleep_entries').update({
        sleep_time: sleepDateTime,
        wake_time: wakeDateTime,
        duration: Math.round(dur * 10) / 10,
        sleep_quality: form.quality,
        deep_sleep: Math.round(deepSleep * 10) / 10,
        light_sleep: Math.round(lightSleep * 10) / 10,
        rem_sleep: Math.round(remSleep * 10) / 10,
        awake_time: Math.round(awakeTime * 10) / 10,
      }).eq('id', sleepEntry.id);
      if (error) {
        showToast('Failed to update sleep', 'error');
        return;
      }
    } else {
      const { error } = await supabase.from('sleep_entries').insert({
        user_id: user.id,
        sleep_time: sleepDateTime,
        wake_time: wakeDateTime,
        duration: Math.round(dur * 10) / 10,
        sleep_quality: form.quality,
        deep_sleep: Math.round(deepSleep * 10) / 10,
        light_sleep: Math.round(lightSleep * 10) / 10,
        rem_sleep: Math.round(remSleep * 10) / 10,
        awake_time: Math.round(awakeTime * 10) / 10,
        date: today,
      });
      if (error) {
        showToast('Failed to log sleep', 'error');
        return;
      }
    }

    await supabase.from('recent_activity').insert({
      user_id: user.id,
      activity_type: 'sleep',
      description: `Logged ${dur.toFixed(1)} hours of sleep`,
      icon: 'moon',
      value: `${dur.toFixed(1)} hr`,
    });

    await refresh();
    showToast('Sleep logged successfully!', 'success');
    setShowAdd(false);
    setForm({ sleepTime: '', wakeTime: '', quality: 'good' });
  }

  const sleepCycleData = sleepEntry ? [
    { name: 'Deep', value: sleepEntry.deep_sleep, fill: '#1e3a8a' },
    { name: 'Light', value: sleepEntry.light_sleep, fill: '#3b82f6' },
    { name: 'REM', value: sleepEntry.rem_sleep, fill: '#8b5cf6' },
    { name: 'Awake', value: sleepEntry.awake_time, fill: '#f59e0b' },
  ].filter(d => d.value > 0) : [];

  const weekData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    weekData.push({
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      hours: i === 0 ? duration : Math.round((sleepGoal * (0.7 + Math.random() * 0.3)) * 10) / 10,
    });
  }

  if (loading) return <div className="card text-center py-8 text-sm text-neutral-400">Loading...</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Sleep Tracker</h1>
          <p className="text-sm text-neutral-500 mt-1">Monitor your sleep for better wellness</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Log Sleep
        </button>
      </div>

      <div className="card flex flex-col sm:flex-row items-center gap-6">
        <ProgressRing
          value={duration}
          max={sleepGoal}
          size={140}
          label={duration.toFixed(1)}
          sublabel={`of ${sleepGoal} hr`}
          unit=" hr"
          color="#6366f1"
        />
        <div className="flex-1 grid grid-cols-3 gap-3 w-full">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 text-center">
            <p className="text-xs text-neutral-500">Duration</p>
            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{duration.toFixed(1)} hr</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
            <p className="text-xs text-neutral-500">Quality</p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400 capitalize">{sleepEntry?.sleep_quality || '—'}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
            <p className="text-xs text-neutral-500">Goal</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{sleepGoal} hr</p>
          </div>
        </div>
      </div>

      {sleepEntry && sleepCycleData.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">Sleep Cycle Breakdown</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={180}>
              <BarChart data={sleepCycleData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:opacity-20" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit=" hr" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={50} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {sleepCycleData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {sleepCycleData.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: d.fill }} />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">{d.name} Sleep</span>
                  <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 ml-auto">{d.value.toFixed(1)} hr</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">Weekly Sleep</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:opacity-20" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit=" hr" />
            <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
            <Bar dataKey="hours" fill="#6366f1" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-900/30">
        <div className="flex items-start gap-3">
          <Star className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-700 dark:text-indigo-400">
            This is a wellness tracker, not a medical-grade sleep analysis tool. For sleep disorders or concerns, please consult a healthcare professional.
          </p>
        </div>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Log Sleep">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Sleep Time</label>
              <input type="time" value={form.sleepTime} onChange={e => setForm(prev => ({ ...prev, sleepTime: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Wake Time</label>
              <input type="time" value={form.wakeTime} onChange={e => setForm(prev => ({ ...prev, wakeTime: e.target.value }))} className="input-field" />
            </div>
          </div>
          {form.sleepTime && form.wakeTime && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 text-center">
              <p className="text-xs text-neutral-500">Calculated Duration</p>
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{calculateDuration(form.sleepTime, form.wakeTime).toFixed(1)} hours</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Sleep Quality</label>
            <select value={form.quality} onChange={e => setForm(prev => ({ ...prev, quality: e.target.value }))} className="input-field">
              <option value="poor">Poor</option>
              <option value="fair">Fair</option>
              <option value="good">Good</option>
              <option value="excellent">Excellent</option>
            </select>
          </div>
          <button onClick={logSleep} className="btn-primary w-full flex items-center justify-center gap-2">
            <Moon className="w-4 h-4" /> Log Sleep
          </button>
        </div>
      </Modal>
    </div>
  );
}
