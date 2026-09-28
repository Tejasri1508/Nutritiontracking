import { Link } from 'react-router-dom';
import { Heart, Utensils, Calendar, Droplets, Footprints, Moon, Dumbbell, ScanLine, ArrowRight, Activity } from 'lucide-react';

export function LandingPage() {
  const features = [
    { icon: Utensils, title: 'Food Tracking', desc: 'Log meals and track nutrition with detailed macro breakdowns.' },
    { icon: Calendar, title: 'Calorie Tracking', desc: 'Monitor daily calories with automatic updates and goals.' },
    { icon: Moon, title: 'Sleep Tracking', desc: 'Track sleep duration and quality for better rest patterns.' },
    { icon: Footprints, title: 'Step Tracking', desc: 'Count daily steps and celebrate milestone achievements.' },
    { icon: Droplets, title: 'Water Reminders', desc: 'Stay hydrated with customizable water reminders.' },
    { icon: Dumbbell, title: 'Workout Tracking', desc: 'Track exercises with live workout mode and form checking.' },
    { icon: ScanLine, title: 'AI Food Recognition', desc: 'Scan food with your camera for instant nutrition estimates.' },
    { icon: Activity, title: 'Health Insights', desc: 'Get wellness insights based on your tracked data.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-lime-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-lime-500 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-neutral-900 dark:text-neutral-100">Nutrition Tracker</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-green-600 transition-colors">
              Login
            </Link>
            <Link to="/register" className="btn-primary text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium mb-6">
            <Heart className="w-4 h-4" /> Start Your Health Journey
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 dark:text-neutral-100 leading-tight mb-6">
            Track Your Nutrition,<br />
            <span className="bg-gradient-to-r from-green-600 to-lime-500 bg-clip-text text-transparent">Transform Your Life</span>
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-8">
            Your complete wellness companion. Track calories, water, sleep, steps, and workouts — all in one beautiful dashboard powered by AI food recognition.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="btn-primary px-6 py-3 text-base flex items-center gap-2 justify-center">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="btn-secondary px-6 py-3 text-base">
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white dark:bg-neutral-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-neutral-900 dark:text-neutral-100 mb-4">
            Everything You Need to Stay Healthy
          </h2>
          <p className="text-center text-neutral-500 dark:text-neutral-400 mb-12 max-w-2xl mx-auto">
            Eight powerful features designed to help you build healthier habits every single day.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, i) => (
              <div
                key={i}
                className="card card-hover group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-lime-100 dark:from-green-900/30 dark:to-lime-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5">{feature.title}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="card bg-gradient-to-br from-green-600 to-lime-600 border-0 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Take Control of Your Health?</h2>
            <p className="text-green-50 mb-6">Join thousands of users tracking their wellness journey with Nutrition Tracker.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register" className="bg-white text-green-700 font-medium px-6 py-3 rounded-xl hover:bg-green-50 transition-colors">
                Create Free Account
              </Link>
              <Link to="/login" className="border border-white/40 text-white font-medium px-6 py-3 rounded-xl hover:bg-white/10 transition-colors">
                Login to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 border-t border-neutral-200 dark:border-neutral-800">
        <p className="text-center text-sm text-neutral-400">Nutrition Tracker — Your Wellness Companion</p>
      </footer>
    </div>
  );
}
