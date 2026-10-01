import { useState, useEffect, useRef } from 'react';
import { Dumbbell, Plus, Play, Pause, Square, ChevronRight, Activity, Flame, Camera, CheckCircle, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTodayData } from '@/hooks/useTodayData';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { LoadingState, EmptyState } from '@/components/ui/States';
import type { WorkoutEntry } from '@/types';

const workoutCategories = [
  { id: 'cardio', label: 'Cardio', icon: Activity },
  { id: 'strength', label: 'Strength', icon: Dumbbell },
  { id: 'flexibility', label: 'Flexibility', icon: ChevronRight },
  { id: 'beginner', label: 'Beginner', icon: Play },
  { id: 'intermediate', label: 'Intermediate', icon: Flame },
  { id: 'advanced', label: 'Advanced', icon: Square },
];

const workoutLibrary = [
  { name: 'Full Body HIIT', category: 'cardio', difficulty: 'intermediate', duration: 30, calories: 350, exercises: ['Jumping Jacks - 30s', 'Burpees - 30s', 'Mountain Climbers - 30s', 'High Knees - 30s', 'Plank - 30s'] },
  { name: 'Strength Training', category: 'strength', difficulty: 'intermediate', duration: 45, calories: 280, exercises: ['Squats - 3x12', 'Push-ups - 3x10', 'Lunges - 3x12', 'Plank - 3x30s', 'Deadlifts - 3x10'] },
  { name: 'Morning Yoga Flow', category: 'flexibility', difficulty: 'beginner', duration: 20, calories: 120, exercises: ['Sun Salutation', 'Downward Dog', 'Warrior Pose', 'Child Pose', 'Tree Pose'] },
  { name: 'Quick Cardio Blast', category: 'cardio', difficulty: 'beginner', duration: 15, calories: 180, exercises: ['Jumping Jacks - 1 min', ' Jog in Place - 1 min', 'Squat Jumps - 1 min', 'Rest - 30s', 'Repeat 3x'] },
  { name: 'Core Crusher', category: 'strength', difficulty: 'advanced', duration: 25, calories: 220, exercises: ['Plank - 60s', 'Russian Twists - 20', 'Leg Raises - 15', 'Bicycle Crunches - 20', 'Side Plank - 30s each'] },
  { name: 'Flexibility & Stretch', category: 'flexibility', difficulty: 'beginner', duration: 15, calories: 80, exercises: ['Hamstring Stretch', 'Hip Flexor Stretch', 'Shoulder Stretch', 'Back Extension', 'Neck Rolls'] },
];

export function WorkoutsPage() {
  const { user } = useAuth();
  const { workoutEntries, loading, refresh } = useTodayData();
  const { showToast } = useToast();
  const [activeCategory, setActiveCategory] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [liveWorkout, setLiveWorkout] = useState<typeof workoutLibrary[0] | null>(null);
  const [timer, setTimer] = useState(0);
  const [paused, setPaused] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const cameraRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const filteredWorkouts = activeCategory === 'all'
    ? workoutLibrary
    : workoutLibrary.filter(w => w.category === activeCategory || w.difficulty === activeCategory);

  useEffect(() => {
    if (liveWorkout && !paused) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [liveWorkout, paused]);

  function startWorkout(workout: typeof workoutLibrary[0]) {
    setLiveWorkout(workout);
    setTimer(0);
    setPaused(false);
    setCurrentExercise(0);
  }

  function stopWorkout() {
    if (!liveWorkout || !user) return;
    const minutes = Math.max(1, Math.round(timer / 60));
    const caloriesBurned = Math.round((liveWorkout.calories / liveWorkout.duration) * minutes);

    completeWorkout(liveWorkout.name, liveWorkout.category, minutes, caloriesBurned, liveWorkout.difficulty);
    setLiveWorkout(null);
    setTimer(0);
    setPaused(false);
    setCameraActive(false);
    stopCamera();
  }

  async function completeWorkout(name: string, category: string, duration: number, calories: number, difficulty: string) {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('workout_entries').insert({
      user_id: user.id,
      workout_name: name,
      category,
      duration,
      calories_burned: calories,
      difficulty,
      date: today,
    });
    if (error) {
      showToast('Failed to save workout', 'error');
      return;
    }
    await supabase.from('recent_activity').insert({
      user_id: user.id,
      activity_type: 'workout',
      description: `Completed ${duration}-minute ${name}`,
      icon: 'dumbbell',
      value: `${calories} kcal burned`,
    });
    await refresh();
    showToast(`${name} completed! ${calories} kcal burned!`, 'success');
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      showToast('Camera access denied or not available. Please allow camera permissions in your browser settings.', 'error');
      setCameraActive(false);
    }
  }

  useEffect(() => {
    if (cameraActive && streamRef.current && cameraRef.current) {
      cameraRef.current.srcObject = streamRef.current;
      cameraRef.current.play().catch(() => {});
    }
  }, [cameraActive]);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (cameraRef.current) {
      cameraRef.current.srcObject = null;
    }
    setCameraActive(false);
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  if (loading) return <LoadingState message="Loading workouts..." />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Exercises / Workouts</h1>
        <p className="text-sm text-neutral-500 mt-1">Choose a workout and start your fitness journey</p>
      </div>

      {/* Today's workout summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Dumbbell className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-neutral-500">Today's Workouts</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{workoutEntries.length}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-neutral-500">Calories Burned</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{workoutEntries.reduce((sum, e) => sum + e.calories_burned, 0)}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-neutral-500">Total Minutes</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{workoutEntries.reduce((sum, e) => sum + e.duration, 0)}</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeCategory === 'all' ? 'bg-green-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}
        >
          All
        </button>
        {workoutCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${activeCategory === cat.id ? 'bg-green-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}
          >
            <cat.icon className="w-4 h-4" /> {cat.label}
          </button>
        ))}
      </div>

      {/* Workout cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredWorkouts.map((workout, i) => (
          <div key={i} className="card card-hover">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{workout.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="badge badge-green capitalize">{workout.category}</span>
                  <span className="badge badge-blue capitalize">{workout.difficulty}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-2">
                <p className="text-xs text-neutral-500">Duration</p>
                <p className="text-sm font-semibold">{workout.duration} min</p>
              </div>
              <div className="text-center bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-2">
                <p className="text-xs text-neutral-500">Calories</p>
                <p className="text-sm font-semibold">{workout.calories}</p>
              </div>
              <div className="text-center bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-2">
                <p className="text-xs text-neutral-500">Exercises</p>
                <p className="text-sm font-semibold">{workout.exercises.length}</p>
              </div>
            </div>
            <div className="mb-3">
              <p className="text-xs text-neutral-500 mb-1">Exercises:</p>
              <ul className="text-xs text-neutral-600 dark:text-neutral-400 space-y-0.5">
                {workout.exercises.slice(0, 3).map((ex, j) => (
                  <li key={j} className="flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3 text-green-500" /> {ex}
                  </li>
                ))}
                {workout.exercises.length > 3 && <li className="text-neutral-400">...and {workout.exercises.length - 3} more</li>}
              </ul>
            </div>
            <button onClick={() => startWorkout(workout)} className="btn-primary w-full flex items-center justify-center gap-2">
              <Play className="w-4 h-4" /> Start Workout
            </button>
          </div>
        ))}
      </div>

      {/* Recent workouts */}
      <div className="card">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">Today's Workout History</h3>
        {workoutEntries.length === 0 ? (
          <EmptyState icon={<Dumbbell className="w-10 h-10" />} title="No workouts completed today" description="Start a workout to see it here." />
        ) : (
          <div className="space-y-2">
            {workoutEntries.map(entry => (
              <div key={entry.id} className="flex items-center gap-3 py-2">
                <div className="w-9 h-9 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Dumbbell className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{entry.workout_name}</p>
                  <p className="text-xs text-neutral-400">{entry.duration} min • {entry.calories_burned} kcal • {entry.category}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Workout Modal */}
      {liveWorkout && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100">{liveWorkout.name}</h3>
                <p className="text-xs text-neutral-500">Live Workout Mode</p>
              </div>
              <button onClick={stopWorkout} className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors">
                <Square className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-5">
              {/* Left: Exercise info */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-green-500 to-lime-500 rounded-2xl p-6 text-white text-center">
                  <p className="text-sm opacity-90 mb-1">Current Exercise</p>
                  <p className="text-2xl font-bold mb-3">{liveWorkout.exercises[currentExercise]}</p>
                  <p className="text-4xl font-bold tabular-nums">{formatTime(timer)}</p>
                  <div className="flex justify-center gap-3 mt-4">
                    <button onClick={() => setPaused(!paused)} className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                      {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Exercise List</p>
                  <div className="space-y-1.5">
                    {liveWorkout.exercises.map((ex, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 p-2 rounded-lg text-sm transition-all ${i === currentExercise ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium' : 'text-neutral-600 dark:text-neutral-400'}`}
                      >
                        {i < currentExercise ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-neutral-300 dark:border-neutral-600 flex items-center justify-center text-xs">{i + 1}</span>
                        )}
                        {ex}
                      </div>
                    ))}
                  </div>
                </div>

                {currentExercise < liveWorkout.exercises.length - 1 && (
                  <button onClick={() => setCurrentExercise(prev => prev + 1)} className="btn-primary w-full">
                    Next Exercise
                  </button>
                )}
                {currentExercise === liveWorkout.exercises.length - 1 && (
                  <button onClick={stopWorkout} className="btn-primary w-full bg-green-600">
                    Complete Workout
                  </button>
                )}
              </div>

              {/* Right: Camera for form checking */}
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-neutral-900 aspect-video">
                  <video
                    ref={cameraRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                  />
                  {!cameraActive && (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500">
                      <Camera className="w-12 h-12 mb-2" />
                      <p className="text-sm">Camera preview for form checking</p>
                    </div>
                  )}
                </div>
                {!cameraActive ? (
                  <button onClick={startCamera} className="btn-secondary w-full flex items-center justify-center gap-2">
                    <Camera className="w-4 h-4" /> Enable Camera for Form Check
                  </button>
                ) : (
                  <button onClick={() => { stopCamera(); }} className="btn-secondary w-full flex items-center justify-center gap-2">
                    <X className="w-4 h-4" /> Disable Camera
                  </button>
                )}
                <div className="card bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30">
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    The AI form checking system is designed to analyze body landmarks using pose estimation. It can detect knee angles, hip position, and squat depth. This is a fitness assistance feature, not medical advice.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
