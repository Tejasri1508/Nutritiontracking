import { useState, useRef } from 'react';
import { Camera, Upload, Loader2, ScanLine, Edit2, Check, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useTodayData } from '@/hooks/useTodayData';
import { AddToCaloriesModal } from '@/components/AddToCaloriesModal';

interface DetectedFood {
  foodName: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  servingSize: string;
  confidence: number;
}

const sampleFoods: DetectedFood[] = [
  { foodName: 'Grilled Chicken Salad', calories: 450, protein: 35, carbohydrates: 25, fat: 20, fiber: 6, servingSize: '1 bowl', confidence: 92 },
  { foodName: 'Vegetable Rice Bowl', calories: 380, protein: 9, carbohydrates: 68, fat: 12, fiber: 5, servingSize: '1 plate', confidence: 87 },
  { foodName: 'Avocado Toast', calories: 320, protein: 10, carbohydrates: 35, fat: 16, fiber: 8, servingSize: '2 slices', confidence: 85 },
  { foodName: 'Berry Smoothie Bowl', calories: 250, protein: 8, carbohydrates: 45, fat: 5, fiber: 7, servingSize: '1 bowl', confidence: 78 },
  { foodName: 'Chocolate Brownie', calories: 320, protein: 5, carbohydrates: 42, fat: 15, fiber: 2, servingSize: '1 piece', confidence: 90 },
  { foodName: 'Pancakes with Syrup', calories: 520, protein: 8, carbohydrates: 85, fat: 18, fiber: 3, servingSize: '3 pancakes', confidence: 81 },
];

export function FoodScannerPage() {
  const { showToast } = useToast();
  const { refresh } = useTodayData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLVideoElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [detected, setDetected] = useState<DetectedFood | null>(null);
  const [editing, setEditing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editedFood, setEditedFood] = useState<DetectedFood | null>(null);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Please upload a JPG, PNG, or WebP image', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('Image must be under 10MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      setImagePreview(ev.target?.result as string);
      analyzeImage();
    };
    reader.readAsDataURL(file);
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (cameraRef.current) {
        cameraRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch {
      showToast('Camera access denied or not available. Try uploading an image instead.', 'error');
    }
  }

  function capturePhoto() {
    if (!cameraRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = cameraRef.current.videoWidth;
    canvas.height = cameraRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(cameraRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setImagePreview(dataUrl);
    stopCamera();
    analyzeImage();
  }

  function stopCamera() {
    if (cameraRef.current?.srcObject) {
      const stream = cameraRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      cameraRef.current.srcObject = null;
    }
    setCameraActive(false);
  }

  function analyzeImage() {
    setDetected(null);
    setAnalyzing(true);
    setTimeout(() => {
      const sample = sampleFoods[Math.floor(Math.random() * sampleFoods.length)];
      setDetected(sample);
      setEditedFood(sample);
      setAnalyzing(false);
      showToast('Food analyzed successfully!', 'success');
    }, 2500);
  }

  function startEditing() {
    setEditing(true);
  }

  function saveEdits() {
    if (editedFood) {
      setDetected(editedFood);
    }
    setEditing(false);
    showToast('Changes saved', 'success');
  }

  function reset() {
    setImagePreview(null);
    setDetected(null);
    setEditedFood(null);
    setEditing(false);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">AI Food Scanner</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Take a photo or upload an image to detect food and estimate nutrition information.
        </p>
      </div>

      {!imagePreview && !cameraActive && (
        <div className="card">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={startCamera} className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-green-300 dark:border-green-800 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Camera className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">Scan Food</p>
              <p className="text-xs text-neutral-500 mt-1">Use your camera</p>
            </button>

            <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">Upload Food Image</p>
              <p className="text-xs text-neutral-500 mt-1">JPG, PNG, WebP</p>
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileUpload} className="hidden" />
        </div>
      )}

      {cameraActive && (
        <div className="card space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-black">
            <video ref={cameraRef} autoPlay playsInline className="w-full" />
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={capturePhoto} className="btn-primary flex items-center gap-2">
              <Camera className="w-5 h-5" /> Capture Photo
            </button>
            <button onClick={stopCamera} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {imagePreview && (
        <div className="card space-y-4">
          <div className="relative rounded-xl overflow-hidden">
            <img src={imagePreview} alt="Food" className="w-full max-h-80 object-cover" />
            <button onClick={reset} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {analyzing && (
            <div className="flex flex-col items-center py-8">
              <div className="relative">
                <ScanLine className="w-12 h-12 text-green-500 animate-pulse" />
                <Loader2 className="w-12 h-12 text-green-500 animate-spin absolute inset-0 opacity-30" />
              </div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mt-3">Analyzing your food...</p>
              <p className="text-xs text-neutral-400 mt-1">Detecting food item and estimating nutrition</p>
            </div>
          )}

          {detected && !analyzing && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">Food Detected Successfully</p>
                  <p className="text-xs text-green-600 dark:text-green-500">Confidence: {detected.confidence}%</p>
                </div>
                {!editing ? (
                  <button onClick={startEditing} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                ) : (
                  <button onClick={saveEdits} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Save
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Food Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={editedFood?.foodName || ''}
                      onChange={e => setEditedFood(prev => ({ ...prev!, foodName: e.target.value }))}
                      className="input-field text-sm"
                    />
                  ) : (
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">{detected.foodName}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Serving Size</label>
                  {editing ? (
                    <input
                      type="text"
                      value={editedFood?.servingSize || ''}
                      onChange={e => setEditedFood(prev => ({ ...prev!, servingSize: e.target.value }))}
                      className="input-field text-sm"
                    />
                  ) : (
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">{detected.servingSize}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Calories', key: 'calories', unit: 'kcal', color: 'orange' },
                  { label: 'Protein', key: 'protein', unit: 'g', color: 'blue' },
                  { label: 'Carbs', key: 'carbohydrates', unit: 'g', color: 'orange' },
                  { label: 'Fat', key: 'fat', unit: 'g', color: 'purple' },
                  { label: 'Fiber', key: 'fiber', unit: 'g', color: 'green' },
                ].map(field => (
                  <div key={field.key} className={`bg-${field.color}-50 dark:bg-${field.color}-900/20 rounded-xl p-3 text-center`}>
                    <p className="text-xs text-neutral-500">{field.label}</p>
                    {editing ? (
                      <input
                        type="number"
                        value={editedFood?.[field.key as keyof DetectedFood] as number || 0}
                        onChange={e => setEditedFood(prev => ({ ...prev!, [field.key]: Number(e.target.value) }))}
                        className="w-full mt-1 px-2 py-1 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-center"
                      />
                    ) : (
                      <>
                        <p className={`text-lg font-bold text-${field.color}-600 dark:text-${field.color}-400`}>
                          {detected[field.key as keyof DetectedFood] as number}
                        </p>
                        <p className="text-xs text-neutral-400">{field.unit}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <button onClick={() => setShowAddModal(true)} className="btn-primary w-full">
                Add to Daily Tracker
              </button>
            </div>
          )}
        </div>
      )}

      {/* Info note */}
      <div className="card bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30">
        <p className="text-xs text-blue-700 dark:text-blue-400">
          The food recognition system is designed to connect to a real AI nutrition API. Currently running in demo mode with sample food data. The architecture supports plugging in any image recognition service.
        </p>
      </div>

      {detected && (
        <AddToCaloriesModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          foodName={detected.foodName}
          calories={detected.calories}
          protein={detected.protein}
          carbs={detected.carbohydrates}
          fat={detected.fat}
          fiber={detected.fiber}
          servingSize={detected.servingSize}
          imageUrl={imagePreview}
          source="scanner"
        />
      )}
    </div>
  );
}
