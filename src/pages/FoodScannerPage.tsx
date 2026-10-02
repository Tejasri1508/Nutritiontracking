import { useState, useRef } from 'react';
import { Camera, Upload, Loader2, ScanLine, Edit2, Check, X, Calculator, Sparkles, AlertCircle } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
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

type Mode = 'idle' | 'camera' | 'preview' | 'analyzing' | 'result' | 'manual';

const GEMINI_MODEL = 'gemini-3.8-flash';

const ANALYSIS_PROMPT = `You are a nutrition expert. Analyze this food image and return ONLY a JSON object (no markdown, no code fences) with these exact fields:
{
  "foodName": "the specific name of the dish or food item shown",
  "calories": estimated calories as a number,
  "protein": protein in grams as a number,
  "carbohydrates": carbs in grams as a number,
  "fat": fat in grams as a number,
  "fiber": fiber in grams as a number,
  "servingSize": "e.g., 1 plate, 1 bowl, 2 slices",
  "confidence": your confidence level 0-100 as a number
}
If the image does not contain food, return: {"foodName":"Not a food item","calories":0,"protein":0,"carbohydrates":0,"fat":0,"fiber":0,"servingSize":"","confidence":0}`;

const FALLBACK_FOODS: DetectedFood[] = [
  { foodName: 'Grilled Chicken Salad', calories: 450, protein: 35, carbohydrates: 25, fat: 20, fiber: 6, servingSize: '1 bowl', confidence: 50 },
  { foodName: 'Vegetable Rice Bowl', calories: 380, protein: 9, carbohydrates: 68, fat: 12, fiber: 5, servingSize: '1 plate', confidence: 50 },
  { foodName: 'Avocado Toast', calories: 320, protein: 10, carbohydrates: 35, fat: 16, fiber: 8, servingSize: '2 slices', confidence: 50 },
  { foodName: 'Berry Smoothie Bowl', calories: 250, protein: 8, carbohydrates: 45, fat: 5, fiber: 7, servingSize: '1 bowl', confidence: 50 },
];

export function FoodScannerPage() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<Mode>('idle');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [detected, setDetected] = useState<DetectedFood | null>(null);
  const [editing, setEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editedFood, setEditedFood] = useState<DetectedFood | null>(null);

  // Manual entry state
  const [manualFood, setManualFood] = useState({
    foodName: '',
    servingSize: '1 serving',
    calories: '',
    protein: '',
    carbohydrates: '',
    fat: '',
    fiber: '',
  });
  const [manualServings, setManualServings] = useState(1);
  const [manualResult, setManualResult] = useState<DetectedFood | null>(null);

  const [analyzeError, setAnalyzeError] = useState('');

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
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      setMode('preview');
      analyzeImage(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setMode('camera');
      requestAnimationFrame(() => {
        if (cameraRef.current) {
          cameraRef.current.srcObject = stream;
          cameraRef.current.play().catch(() => {});
        }
      });
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
    setMode('preview');
    analyzeImage(dataUrl);
  }

  function stopCamera() {
    if (cameraRef.current?.srcObject) {
      const stream = cameraRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      cameraRef.current.srcObject = null;
    }
    if (mode === 'camera') setMode('idle');
  }

  function analyzeImage(imageData: string | null) {
    setDetected(null);
    setAnalyzeError('');
    setMode('analyzing');

    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
      setTimeout(() => {
        const sample = FALLBACK_FOODS[Math.floor(Math.random() * FALLBACK_FOODS.length)];
        setDetected(sample);
        setEditedFood(sample);
        setMode('result');
        setAnalyzeError('Demo mode — add a free Gemini API key in Settings for real food recognition.');
        showToast('Running in demo mode. Add a Gemini API key in Settings for real recognition.', 'info');
      }, 2000);
      return;
    }

    if (!imageData) {
      showToast('No image to analyze', 'error');
      setMode('preview');
      return;
    }

    const base64Data = imageData.split(',')[1];

    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: ANALYSIS_PROMPT },
            { inline_data: { mime_type: 'image/jpeg', data: base64Data } },
          ],
        }],
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
      }),
    })
      .then(async res => {
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody?.error?.message || `API error (${res.status})`);
        }
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('No response from AI');
        const parsed = JSON.parse(text);
        if (!parsed.foodName || parsed.foodName === 'Not a food item') {
          throw new Error('No food detected in this image. Try a clearer photo.');
        }
        const result: DetectedFood = {
          foodName: parsed.foodName,
          calories: Math.round(parsed.calories || 0),
          protein: Math.round((parsed.protein || 0) * 10) / 10,
          carbohydrates: Math.round((parsed.carbohydrates || 0) * 10) / 10,
          fat: Math.round((parsed.fat || 0) * 10) / 10,
          fiber: Math.round((parsed.fiber || 0) * 10) / 10,
          servingSize: parsed.servingSize || '1 serving',
          confidence: Math.round(parsed.confidence || 80),
        };
        setDetected(result);
        setEditedFood(result);
        setMode('result');
        showToast(`Detected: ${result.foodName}`, 'success');
      })
      .catch((err) => {
        setAnalyzeError(err.message);
        setMode('preview');
        showToast(err.message || 'Failed to analyze image', 'error');
      });
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
    setMode('idle');
  }

  function calculateManual() {
    if (!manualFood.foodName || !manualFood.calories) {
      showToast('Please enter at least the food name and calories', 'error');
      return;
    }
    const baseCalories = Number(manualFood.calories) || 0;
    const baseProtein = Number(manualFood.protein) || 0;
    const baseCarbs = Number(manualFood.carbohydrates) || 0;
    const baseFat = Number(manualFood.fat) || 0;
    const baseFiber = Number(manualFood.fiber) || 0;

    const result: DetectedFood = {
      foodName: manualFood.foodName,
      calories: Math.round(baseCalories * manualServings),
      protein: Math.round(baseProtein * manualServings * 10) / 10,
      carbohydrates: Math.round(baseCarbs * manualServings * 10) / 10,
      fat: Math.round(baseFat * manualServings * 10) / 10,
      fiber: Math.round(baseFiber * manualServings * 10) / 10,
      servingSize: manualFood.servingSize,
      confidence: 100,
    };
    setManualResult(result);
    showToast('Calculated! Check the totals below.', 'success');
  }

  function resetManual() {
    setManualFood({ foodName: '', servingSize: '1 serving', calories: '', protein: '', carbohydrates: '', fat: '', fiber: '' });
    setManualServings(1);
    setManualResult(null);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">AI Food Scanner</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Scan your food with AI, or manually enter food details to calculate nutrition.
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => { reset(); resetManual(); setMode('idle'); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${mode !== 'manual' ? 'bg-green-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}
        >
          Scan / Upload
        </button>
        <button
          onClick={() => { reset(); setMode('manual'); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${mode === 'manual' ? 'bg-green-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}
        >
          <Calculator className="w-4 h-4" /> Calculate Manually
        </button>
      </div>

      {/* === SCAN / UPLOAD MODE === */}
      {mode === 'idle' && (
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

      {mode === 'camera' && (
        <div className="card space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-black">
            <video ref={cameraRef} autoPlay playsInline muted className="w-full" />
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={capturePhoto} className="btn-primary flex items-center gap-2">
              <Camera className="w-5 h-5" /> Capture Photo
            </button>
            <button onClick={stopCamera} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {(mode === 'preview' || mode === 'analyzing' || mode === 'result') && imagePreview && (
        <div className="card space-y-4">
          <div className="relative rounded-xl overflow-hidden">
            <img src={imagePreview} alt="Food" className="w-full max-h-80 object-cover" />
            <button onClick={reset} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {mode === 'analyzing' && (
            <div className="flex flex-col items-center py-8">
              <div className="relative">
                <ScanLine className="w-12 h-12 text-green-500 animate-pulse" />
                <Loader2 className="w-12 h-12 text-green-500 animate-spin absolute inset-0 opacity-30" />
              </div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mt-3">Analyzing your food...</p>
              <p className="text-xs text-neutral-400 mt-1">AI is identifying the food item and estimating nutrition</p>
            </div>
          )}

          {mode === 'preview' && analyzeError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Could not analyze image</p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">{analyzeError}</p>
                <button onClick={() => analyzeImage(imagePreview)} className="text-xs text-amber-700 dark:text-amber-400 underline mt-1.5">Try again</button>
              </div>
            </div>
          )}

          {mode === 'result' && detected && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">Food Detected — Please Verify</p>
                  <p className="text-xs text-green-600 dark:text-green-500">Confidence: {detected.confidence}% — Edit if the name is wrong</p>
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
                  { label: 'Calories', key: 'calories', unit: 'kcal' },
                  { label: 'Protein', key: 'protein', unit: 'g' },
                  { label: 'Carbs', key: 'carbohydrates', unit: 'g' },
                  { label: 'Fat', key: 'fat', unit: 'g' },
                  { label: 'Fiber', key: 'fiber', unit: 'g' },
                ].map(field => (
                  <div key={field.key} className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-3 text-center">
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
                        <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
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

      {/* === MANUAL CALCULATE MODE === */}
      {mode === 'manual' && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Calculate Nutrition</h3>
            </div>
            <p className="text-xs text-neutral-500">
              Enter the food name and its nutrition values per serving, then adjust the number of servings to calculate the total.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Food Name *</label>
                <input
                  type="text"
                  value={manualFood.foodName}
                  onChange={e => setManualFood(prev => ({ ...prev, foodName: e.target.value }))}
                  placeholder="e.g., Homemade Dal Rice"
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Serving Size</label>
                <input
                  type="text"
                  value={manualFood.servingSize}
                  onChange={e => setManualFood(prev => ({ ...prev, servingSize: e.target.value }))}
                  placeholder="e.g., 1 bowl"
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Calories (per serving) *</label>
              <input
                type="number"
                value={manualFood.calories}
                onChange={e => setManualFood(prev => ({ ...prev, calories: e.target.value }))}
                placeholder="e.g., 350"
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Protein (g)</label>
                <input type="number" value={manualFood.protein} onChange={e => setManualFood(prev => ({ ...prev, protein: e.target.value }))} placeholder="0" className="input-field text-sm" />
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Carbs (g)</label>
                <input type="number" value={manualFood.carbohydrates} onChange={e => setManualFood(prev => ({ ...prev, carbohydrates: e.target.value }))} placeholder="0" className="input-field text-sm" />
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Fat (g)</label>
                <input type="number" value={manualFood.fat} onChange={e => setManualFood(prev => ({ ...prev, fat: e.target.value }))} placeholder="0" className="input-field text-sm" />
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Fiber (g)</label>
                <input type="number" value={manualFood.fiber} onChange={e => setManualFood(prev => ({ ...prev, fiber: e.target.value }))} placeholder="0" className="input-field text-sm" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Number of Servings</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setManualServings(prev => Math.max(0.5, Math.round((prev - 0.5) * 2) / 2))}
                  className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  −
                </button>
                <span className="text-lg font-bold min-w-[3rem] text-center">{manualServings}</span>
                <button
                  onClick={() => setManualServings(prev => Math.round((prev + 0.5) * 2) / 2)}
                  className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <button onClick={calculateManual} className="btn-primary w-full flex items-center justify-center gap-2">
              <Calculator className="w-4 h-4" /> Calculate Total
            </button>
          </div>

          {manualResult && (
            <div className="card space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">Calculated Result</p>
                  <p className="text-xs text-green-600 dark:text-green-500">
                    {manualServings} × {manualResult.servingSize} of {manualFood.foodName}
                  </p>
                </div>
                <button onClick={resetManual} className="btn-secondary text-xs py-1.5 px-3">Reset</button>
              </div>

              <div>
                <p className="text-xs text-neutral-500 mb-1">Food Name</p>
                <p className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">{manualResult.foodName}</p>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-green-600 dark:text-green-400">{manualResult.calories}</span>
                <span className="text-sm text-neutral-500">kcal total</span>
              </div>

              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <p className="text-xs text-neutral-500">Protein</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{manualResult.protein}g</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                  <p className="text-xs text-neutral-500">Carbs</p>
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{manualResult.carbohydrates}g</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                  <p className="text-xs text-neutral-500">Fat</p>
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{manualResult.fat}g</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <p className="text-xs text-neutral-500">Fiber</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">{manualResult.fiber}g</p>
                </div>
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
          {localStorage.getItem('gemini_api_key')
            ? 'AI food recognition is active. The scanner uses Google Gemini to identify the actual food in your photos. Always verify the detected name and nutrition before adding to your tracker.'
            : 'Demo mode: the scanner picks a random food name. Add a free Gemini API key in Settings to enable real AI food recognition that identifies the actual food in your photos.'}
        </p>
      </div>

      {detected && mode === 'result' && (
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

      {manualResult && mode === 'manual' && (
        <AddToCaloriesModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          foodName={manualResult.foodName}
          calories={manualResult.calories}
          protein={manualResult.protein}
          carbs={manualResult.carbohydrates}
          fat={manualResult.fat}
          fiber={manualResult.fiber}
          servingSize={manualResult.servingSize}
          source="manual"
        />
      )}
    </div>
  );
}
