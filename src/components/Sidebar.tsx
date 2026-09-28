import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ScanLine, Calendar, Droplets, Footprints, Moon,
  Dumbbell, ClipboardList, ShoppingCart, BarChart3, Lightbulb,
  Bell, User, Settings, LogOut, ChevronDown, ChevronRight,
  UtensilsCrossed, Heart, X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [recipesExpanded, setRecipesExpanded] = useState(
    location.pathname.startsWith('/recipes')
  );
  const [dietExpanded, setDietExpanded] = useState(
    location.pathname.startsWith('/recipes/diet')
  );

  const mainNavItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/scanner', icon: ScanLine, label: 'Food Scanner' },
  ];

  const bottomNavItems = [
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/profile', icon: User, label: 'Profile' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const trackerNavItems = [
    { to: '/calories', icon: Calendar, label: 'Daily Calories' },
    { to: '/water', icon: Droplets, label: 'Water Tracker' },
    { to: '/steps', icon: Footprints, label: 'Steps Tracker' },
    { to: '/sleep', icon: Moon, label: 'Sleep Tracker' },
    { to: '/workouts', icon: Dumbbell, label: 'Exercises / Workouts' },
    { to: '/meal-plan', icon: ClipboardList, label: 'Meal Plan' },
    { to: '/grocery-list', icon: ShoppingCart, label: 'Grocery List' },
    { to: '/monthly-summary', icon: BarChart3, label: 'Monthly Summary' },
    { to: '/health-insights', icon: Lightbulb, label: 'Health Insights' },
  ];

  const dietSubItems = [
    { to: '/recipes/diet/weight-loss', label: 'Weight Loss' },
    { to: '/recipes/diet/weight-gain', label: 'Weight Gain' },
  ];

  const recipeCategoryItems = [
    { to: '/recipes/normal', label: 'Normal' },
    { to: '/recipes/breakfast', label: 'Breakfast' },
    { to: '/recipes/lunch', label: 'Lunch' },
    { to: '/recipes/dinner', label: 'Dinner' },
    { to: '/recipes/beverages', label: 'Beverages' },
    { to: '/recipes/desserts', label: 'Desserts' },
  ];

  function isCategoryActive(path: string): boolean {
    if (path === '/recipes/normal') return location.pathname === path;
    return location.pathname === path;
  }

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 z-50 flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-lime-500 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">Nutrition Tracker</h1>
              <p className="text-xs text-neutral-400">Wellness Dashboard</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-neutral-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {mainNavItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* Recipes expandable */}
          <div>
            <button
              onClick={() => setRecipesExpanded(!recipesExpanded)}
              className={`nav-item w-full ${location.pathname.startsWith('/recipes') ? 'nav-item-active' : ''}`}
            >
              <UtensilsCrossed className="w-[18px] h-[18px] flex-shrink-0" />
              <span className="flex-1 text-left">Recipes</span>
              {recipesExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {recipesExpanded && (
              <div className="ml-4 mt-1 space-y-1 animate-expand overflow-hidden">
                {/* Diet sub-expandable */}
                <div>
                  <button
                    onClick={() => setDietExpanded(!dietExpanded)}
                    className={`nav-item w-full text-sm ${
                      location.pathname.startsWith('/recipes/diet') ? 'text-green-600 dark:text-green-400 font-semibold' : ''
                    }`}
                  >
                    <span className="flex-1 text-left pl-1">Diet</span>
                    {dietExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {dietExpanded && (
                    <div className="ml-4 mt-1 space-y-0.5 animate-expand overflow-hidden">
                      {dietSubItems.map(sub => (
                        <NavLink
                          key={sub.to}
                          to={sub.to}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                              isActive
                                ? 'text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/20'
                                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                            }`
                          }
                        >
                          <span className="w-1 h-1 rounded-full bg-current" />
                          {sub.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>

                {recipeCategoryItems.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `nav-item text-sm ${isActive ? 'text-green-600 dark:text-green-400 font-semibold' : ''}`
                    }
                  >
                    <span className="pl-1">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {trackerNavItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div className="pt-3 mt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-1">
            {bottomNavItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User & Logout */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-lime-400 flex items-center justify-center text-white text-sm font-semibold">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200 truncate">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-xs text-neutral-400 truncate">{profile?.username || 'Member'}</p>
            </div>
          </div>
          <button onClick={signOut} className="nav-item w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
