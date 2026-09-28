import { useState, useEffect } from 'react';
import { User, Camera, Save, Weight, Ruler, Target, Activity } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { calculateCalorieGoal } from '@/utils/helpers';
import type { Profile } from '@/types';

export function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Profile>>({});

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name,
        username: profile.username,
        age: profile.age,
        gender: profile.gender,
        height: profile.height,
        weight: profile.weight,
        target_weight: profile.target_weight,
        activity_level: profile.activity_level,
        goal: profile.goal,
        daily_calorie_goal: profile.daily_calorie_goal,
        water_goal: profile.water_goal,
        step_goal: profile.step_goal,
        sleep_goal: profile.sleep_goal,
      });
    }
  }, [profile]);

  function update(key: keyof Profile, value: string | number) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function recalculateCalorieGoal() {
    if (form.weight && form.height && form.age && form.gender && form.activity_level && form.goal) {
      const goal = calculateCalorieGoal(
        Number(form.weight), Number(form.height), Number(form.age),
        form.gender, form.activity_level, form.goal
      );
      update('daily_calorie_goal', goal);
      showToast(`Recalculated calorie goal: ${goal} kcal/day`, 'info');
    }
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name,
      username: form.username,
      age: form.age,
      gender: form.gender,
      height: form.height,
      weight: form.weight,
      target_weight: form.target_weight,
      activity_level: form.activity_level,
      goal: form.goal,
      daily_calorie_goal: form.daily_calorie_goal,
      water_goal: form.water_goal,
      step_goal: form.step_goal,
      sleep_goal: form.sleep_goal,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);

    if (error) {
      showToast('Failed to update profile', 'error');
      setSaving(false);
      return;
    }
    await refreshProfile();
    showToast('Profile updated successfully!', 'success');
    setSaving(false);
  }

  if (!profile) return <div className="card text-center py-8 text-sm text-neutral-400">Loading profile...</div>;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Profile</h1>
        <p className="text-sm text-neutral-500 mt-1">Update your personal information and health goals</p>
      </div>

      {/* Profile header */}
      <div className="card flex items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-lime-400 flex items-center justify-center text-white text-2xl font-bold">
            {profile.full_name?.charAt(0) || 'U'}
          </div>
          <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:bg-neutral-50 transition-colors">
            <Camera className="w-3.5 h-3.5 text-neutral-500" />
          </button>
        </div>
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{profile.full_name}</h2>
          <p className="text-sm text-neutral-500">@{profile.username}</p>
          <p className="text-xs text-neutral-400 mt-1">Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Personal info */}
      <div className="card">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4 flex items-center gap-2">
          <User className="w-4 h-4" /> Personal Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Full Name</label>
            <input type="text" value={form.full_name || ''} onChange={e => update('full_name', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Username</label>
            <input type="text" value={form.username || ''} onChange={e => update('username', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Age</label>
            <input type="number" value={form.age || ''} onChange={e => update('age', Number(e.target.value))} className="input-field" />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Gender</label>
            <select value={form.gender || 'other'} onChange={e => update('gender', e.target.value)} className="input-field">
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Body metrics */}
      <div className="card">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4 flex items-center gap-2">
          <Weight className="w-4 h-4" /> Body Metrics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Height (cm)</label>
            <input type="number" value={form.height || ''} onChange={e => update('height', Number(e.target.value))} className="input-field" />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Weight (kg)</label>
            <input type="number" value={form.weight || ''} onChange={e => update('weight', Number(e.target.value))} className="input-field" />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Target Weight (kg)</label>
            <input type="number" value={form.target_weight || ''} onChange={e => update('target_weight', Number(e.target.value))} className="input-field" />
          </div>
        </div>
      </div>

      {/* Activity & Goals */}
      <div className="card">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4 flex items-center gap-2">
          <Target className="w-4 h-4" /> Activity & Goals
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Activity Level</label>
            <select value={form.activity_level || 'moderate'} onChange={e => update('activity_level', e.target.value)} className="input-field">
              <option value="sedentary">Sedentary</option>
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="active">Active</option>
              <option value="very_active">Very Active</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Goal</label>
            <select value={form.goal || 'maintenance'} onChange={e => update('goal', e.target.value)} className="input-field">
              <option value="weight_loss">Weight Loss</option>
              <option value="maintenance">Maintenance</option>
              <option value="weight_gain">Weight Gain</option>
            </select>
          </div>
        </div>
        <button onClick={recalculateCalorieGoal} className="btn-outline text-sm flex items-center gap-2">
          <Activity className="w-4 h-4" /> Recalculate Calorie Goal
        </button>
      </div>

      {/* Daily targets */}
      <div className="card">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4 flex items-center gap-2">
          <Ruler className="w-4 h-4" /> Daily Targets
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Calorie Goal (kcal)</label>
            <input type="number" value={form.daily_calorie_goal || ''} onChange={e => update('daily_calorie_goal', Number(e.target.value))} className="input-field" />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Water Goal (L)</label>
            <input type="number" step="0.1" value={form.water_goal || ''} onChange={e => update('water_goal', Number(e.target.value))} className="input-field" />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Step Goal</label>
            <input type="number" value={form.step_goal || ''} onChange={e => update('step_goal', Number(e.target.value))} className="input-field" />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Sleep Goal (hours)</label>
            <input type="number" step="0.5" value={form.sleep_goal || ''} onChange={e => update('sleep_goal', Number(e.target.value))} className="input-field" />
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
