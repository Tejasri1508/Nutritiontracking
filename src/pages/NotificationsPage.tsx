import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Trash2, Droplets, Footprints, Moon, Dumbbell, Flame, Utensils, Award } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { formatTimeAgo } from '@/utils/helpers';
import type { Notification } from '@/types';

const notifIcons: Record<string, typeof Bell> = {
  water: Droplets,
  step: Footprints,
  sleep: Moon,
  workout: Dumbbell,
  calorie: Flame,
  food: Utensils,
  goal: Award,
  auth: Bell,
};

export function NotificationsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    async function fetchNotifications() {
      if (!user) return;
      const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setNotifications((data as Notification[]) || []);
      setLoading(false);
    }
    fetchNotifications();
  }, [user]);

  async function markAsRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('All notifications marked as read', 'success');
  }

  async function deleteNotification(id: string) {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  const filteredNotifs = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;
  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) return <LoadingState message="Loading notifications..." />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Notifications</h1>
          <p className="text-sm text-neutral-500 mt-1">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary flex items-center gap-2 text-sm">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'all' ? 'bg-green-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'unread' ? 'bg-green-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {filteredNotifs.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-12 h-12" />}
          title="No notifications"
          description={filter === 'unread' ? "You're all caught up!" : 'Notifications will appear here as you track your health.'}
        />
      ) : (
        <div className="space-y-2">
          {filteredNotifs.map(notif => {
            const Icon = notifIcons[notif.type] || Bell;
            return (
              <div
                key={notif.id}
                className={`card flex items-start gap-3 group cursor-pointer ${!notif.read ? 'border-green-300 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10' : ''}`}
                onClick={() => !notif.read && markAsRead(notif.id)}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  notif.type === 'calorie' ? 'bg-orange-100 dark:bg-orange-900/30' :
                  notif.type === 'water' ? 'bg-cyan-100 dark:bg-cyan-900/30' :
                  notif.type === 'step' ? 'bg-blue-100 dark:bg-blue-900/30' :
                  notif.type === 'sleep' ? 'bg-indigo-100 dark:bg-indigo-900/30' :
                  notif.type === 'workout' ? 'bg-green-100 dark:bg-green-900/30' :
                  notif.type === 'goal' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                  'bg-neutral-100 dark:bg-neutral-800'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    notif.type === 'calorie' ? 'text-orange-600 dark:text-orange-400' :
                    notif.type === 'water' ? 'text-cyan-600 dark:text-cyan-400' :
                    notif.type === 'step' ? 'text-blue-600 dark:text-blue-400' :
                    notif.type === 'sleep' ? 'text-indigo-600 dark:text-indigo-400' :
                    notif.type === 'workout' ? 'text-green-600 dark:text-green-400' :
                    notif.type === 'goal' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-neutral-500'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!notif.read && <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />}
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{notif.title}</p>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">{notif.message}</p>
                  <p className="text-xs text-neutral-400 mt-1">{formatTimeAgo(notif.created_at)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                  className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-all flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
