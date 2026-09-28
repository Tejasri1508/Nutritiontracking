import { useState } from 'react';
import { Droplets, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTodayData } from '@/hooks/useTodayData';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Modal } from '@/components/ui/Modal';
import { formatTimeAgo } from '@/utils/helpers';

export function WaterTrackerPage() {
  const { user, profile } = useAuth();
  const { waterEntries, loading, refresh } = useTodayData();
  const { showToast } = useToast();
  const [showCustom, setShowCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  const waterConsumed = waterEntries.reduce((sum, e) => sum + Number(e.amount), 0);
  const waterGoalMl = (profile?.water_goal || 2.5) * 1000;
  const waterConsumedL = waterConsumed / 1000;
  const waterGoalL = profile?.water_goal || 2.5;

  async function addWater(amount: number) {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('water_entries').insert({
      user_id: user.id,
      amount,
      date: today,
    });
    if (error) {
      showToast('Failed to add water', 'error');
      return;
    }
    await supabase.from('recent_activity').insert({
      user_id: user.id,
      activity_type: 'water',
      description: `Drank ${amount} ml water`,
      icon: 'droplets',
      value: `${amount} ml`,
    });
    await refresh();
    showToast(`${amount} ml added!`, 'success');

    const newTotal = waterConsumed + amount;
    if (newTotal >= waterGoalMl && waterConsumed < waterGoalMl) {
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Water Goal Achieved!',
        message: `You've reached your daily water target of ${waterGoalL}L. Great job staying hydrated!`,
        type: 'goal',
      });
    }
  }

  async function deleteEntry(id: string) {
    const { error } = await supabase.from('water_entries').delete().eq('id', id);
    if (error) {
      showToast('Failed to delete', 'error');
      return;
    }
    await refresh();
  }

  function addCustom() {
    const amount = Number(customAmount);
    if (!amount || amount <= 0) {
      showToast('Enter a valid amount', 'error');
      return;
    }
    addWater(amount);
    setShowCustom(false);
    setCustomAmount('');
  }

  if (loading) return <div className="card text-center py-8 text-sm text-neutral-400">Loading...</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Water Tracker</h1>
        <p className="text-sm text-neutral-500 mt-1">Stay hydrated throughout the day</p>
      </div>

      <div className="card flex flex-col sm:flex-row items-center gap-6">
        <ProgressRing
          value={waterConsumed}
          max={waterGoalMl}
          size={140}
          label={waterConsumedL.toFixed(1)}
          sublabel={`of ${waterGoalL} L`}
          unit=" L"
          color="#06b6d4"
        />
        <div className="flex-1 w-full space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-xl p-3 text-center">
              <p className="text-xs text-neutral-500">Consumed</p>
              <p className="text-lg font-bold text-cyan-600 dark:text-cyan-400">{waterConsumedL.toFixed(2)}L</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
              <p className="text-xs text-neutral-500">Remaining</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{Math.max(0, waterGoalL - waterConsumedL).toFixed(2)}L</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
              <p className="text-xs text-neutral-500">Entries</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{waterEntries.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">Quick Add</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[250, 500, 750, 1000].map(amount => (
            <button
              key={amount}
              onClick={() => addWater(amount)}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-all active:scale-95 group"
            >
              <Droplets className="w-6 h-6 text-cyan-500 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold text-cyan-700 dark:text-cyan-400">+{amount}ml</span>
            </button>
          ))}
        </div>
        <button onClick={() => setShowCustom(true)} className="btn-secondary w-full mt-3 flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Custom Amount
        </button>
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">Today's Log</h3>
        {waterEntries.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-4">No water logged yet today</p>
        ) : (
          <div className="space-y-2">
            {waterEntries.map(entry => (
              <div key={entry.id} className="flex items-center gap-3 py-2 group">
                <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                  <Droplets className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{entry.amount} ml</p>
                  <p className="text-xs text-neutral-400">{formatTimeAgo(entry.created_at)}</p>
                </div>
                <button onClick={() => deleteEntry(entry.id)} className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showCustom} onClose={() => setShowCustom(false)} title="Add Custom Water Amount">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Amount (ml)</label>
            <input type="number" value={customAmount} onChange={e => setCustomAmount(e.target.value)} className="input-field" placeholder="e.g., 300" autoFocus />
          </div>
          <button onClick={addCustom} className="btn-primary w-full">Add Water</button>
        </div>
      </Modal>
    </div>
  );
}
