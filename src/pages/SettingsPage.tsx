import { Moon, Sun, Bell, Droplets, Clock, Settings as SettingsIcon, Info } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useState } from 'react';

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const { showToast } = useToast();
  const [reminders, setReminders] = useState({
    water: true,
    steps: true,
    calorie: true,
    sleep: true,
  });
  const [reminderInterval, setReminderInterval] = useState('2');

  function toggleReminder(key: keyof typeof reminders) {
    setReminders(prev => ({ ...prev, [key]: !prev[key] }));
    showToast(`${key} reminders ${!reminders[key] ? 'enabled' : 'disabled'}`, 'info');
  }

  function testNotification() {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Nutrition Tracker', { body: 'Notifications are working correctly!' });
        showToast('Test notification sent!', 'success');
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Nutrition Tracker', { body: 'Notifications are working correctly!' });
            showToast('Notifications enabled!', 'success');
          } else {
            showToast('Notification permission denied. In-app notifications will be used instead.', 'error');
          }
        });
      } else {
        showToast('Notifications are blocked. Please enable them in your browser settings.', 'error');
      }
    } else {
      showToast('Browser notifications are not supported on this device.', 'error');
    }
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">Customize your Nutrition Tracker experience</p>
      </div>

      {/* Appearance */}
      <div className="card">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4 flex items-center gap-2">
          <SettingsIcon className="w-4 h-4" /> Appearance
        </h3>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            {theme === 'light' ? <Sun className="w-5 h-5 text-orange-500" /> : <Moon className="w-5 h-5 text-indigo-400" />}
            <div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Dark Mode</p>
              <p className="text-xs text-neutral-500">Toggle between light and dark theme</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-12 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-green-500' : 'bg-neutral-300'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4" /> Notifications
        </h3>
        <div className="space-y-3">
          {[
            { key: 'water' as const, label: 'Water Reminders', desc: 'Get reminded to stay hydrated', icon: Droplets },
            { key: 'steps' as const, label: 'Step Milestones', desc: 'Celebrate when you reach step goals', icon: Bell },
            { key: 'calorie' as const, label: 'Calorie Alerts', desc: 'Get notified about calorie limits', icon: Bell },
            { key: 'sleep' as const, label: 'Sleep Reminders', desc: 'Get reminded to log your sleep', icon: Moon },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-neutral-400" />
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{item.label}</p>
                  <p className="text-xs text-neutral-500">{item.desc}</p>
                </div>
              </div>
              <button
                onClick={() => toggleReminder(item.key)}
                className={`relative w-12 h-6 rounded-full transition-colors ${reminders[item.key] ? 'bg-green-500' : 'bg-neutral-300'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${reminders[item.key] ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Water reminder settings */}
      <div className="card">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Water Reminder Settings
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Reminder Interval (hours)</label>
            <select value={reminderInterval} onChange={e => setReminderInterval(e.target.value)} className="input-field">
              <option value="1">Every 1 hour</option>
              <option value="2">Every 2 hours</option>
              <option value="3">Every 3 hours</option>
              <option value="4">Every 4 hours</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Start Time</label>
              <input type="time" defaultValue="08:00" className="input-field" />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">End Time</label>
              <input type="time" defaultValue="22:00" className="input-field" />
            </div>
          </div>
        </div>
      </div>

      {/* Browser notifications */}
      <div className="card">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4" /> Browser Notifications
        </h3>
        <p className="text-xs text-neutral-500 mb-3">
          Enable browser notifications to receive reminders even when you're not actively using the app. If browser notifications are unavailable, in-app notifications will be used instead.
        </p>
        <button onClick={testNotification} className="btn-outline text-sm">
          Test Browser Notification
        </button>
      </div>

      {/* About */}
      <div className="card bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">About Nutrition Tracker</p>
            <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
              Nutrition Tracker is a comprehensive wellness application designed to help you track your daily nutrition, water intake, sleep, steps, and workouts. All data is securely stored and synchronized across sessions.
            </p>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button onClick={signOut} className="btn-secondary w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
        Logout
      </button>
    </div>
  );
}
