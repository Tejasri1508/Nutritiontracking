import React, { useState } from 'react';
import { ChefHat, Target, Filter } from 'lucide-react';
import "./MealPlannerPage.css";

// Mock meal data filtered by preferences (This is the "filter" logic)
const MOCK_MEALS = {
  // Meals for the 'vegan' preference
  vegan: [
    { id: 1, name: "Tofu Scramble (Breakfast)", cals: 350, protein: 20, carbs: 35, fats: 15 },
    { id: 2, name: "Lentil Soup (Lunch)", cals: 420, protein: 25, carbs: 50, fats: 10 },
  ],
  // Meals for the 'keto' preference
  keto: [
    { id: 3, name: "Avocado & Egg Boat (Breakfast)", cals: 550, protein: 18, carbs: 5, fats: 50 },
    { id: 4, name: "Salmon with Asparagus (Dinner)", cals: 600, protein: 40, carbs: 10, fats: 40 },
  ],
  // Standard or fallback meals
  standard: [
    { id: 5, name: "Chicken Stir-fry (Lunch)", cals: 500, protein: 45, carbs: 40, fats: 20 },
    { id: 6, name: "Turkey Sandwich (Lunch)", cals: 400, protein: 30, carbs: 45, fats: 12 },
  ],
};

function MealPlannerPage() {
  // State for the selected dietary preference
  const [preference, setPreference] = useState('standard');
  const [goal, setGoal] = useState('maintain'); 
  const [weeklyPlan, setWeeklyPlan] = useState([]);
  const [loading, setLoading] = useState(false);

  // The list of preferences/restrictions to display in the filter dropdown
  const dietaryOptions = [
    { value: 'standard', label: 'Standard' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'keto', label: 'Keto' },
    { value: 'gluten-free', label: 'Gluten-Free (Mocked)' }, // Example of a mocked filter
  ];

  const generatePlan = async () => {
    setLoading(true);
    setWeeklyPlan([]);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500)); 

    const plan = [];
    
    // --- KEY FILTERING LOGIC ---
    // Selects meals based on the current 'preference' state ('vegan', 'keto', etc.).
    // If a selected preference (like 'gluten-free') doesn't have its own mock list, 
    // it defaults to the 'standard' list.
    const baseMeals = MOCK_MEALS[preference] || MOCK_MEALS.standard;
    
    // Simple logic to build a 3-day mock plan using the filtered meals
    for (let i = 0; i < 3; i++) {
        // Cycle through the filtered base meals
        const meal1 = baseMeals[i % baseMeals.length];
        const meal2 = baseMeals[(i + 1) % baseMeals.length];
        plan.push({
            day: `Day ${i + 1}`,
            breakfast: meal1,
            lunch: meal2,
            // Dinner uses a standard meal as an example
            dinner: MOCK_MEALS.standard[MOCK_MEALS.standard.length - 1] 
        });
    }

    setWeeklyPlan(plan);
    setLoading(false);
  };
  
  const inputStyle = { 
    padding: '10px', 
    borderRadius: '8px', 
    border: '1px solid #d1d5db', 
    marginBottom: '10px',
    width: '100%', 
    boxSizing: 'border-box'
  };

  return (
    <div className="dashboard-container">
      <div className="main-dashboard-card">
        <h2><ChefHat size={24} style={{verticalAlign: 'middle', marginRight: '8px'}} />Personalized Meal Planner</h2>

        <div style={{ padding: '15px', borderRadius: '10px', border: '1px solid #eee', marginBottom: '20px' }}>
          <h4><Target size={18} style={{verticalAlign: 'middle', marginRight: '8px'}} />Set Preferences & Goals</h4>
          
          <label style={{ fontWeight: 'bold', display: 'block', marginTop: '10px' }}>Weight Goal:</label>
          <select value={goal} onChange={(e) => setGoal(e.target.value)} style={inputStyle}>
            <option value="lose">Weight Loss</option>
            <option value="maintain">Maintain Weight</option>
            <option value="gain">Muscle Gain</option>
          </select>

          {/* --- DIETARY PREFERENCE FILTER --- */}
          <label style={{ fontWeight: 'bold', display: 'block' }}>Dietary Preference:</label>
          <select 
            value={preference} 
            onChange={(e) => setPreference(e.target.value)} 
            style={inputStyle}
          >
            {dietaryOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          
          <button
            className="estimate-button"
            onClick={generatePlan}
            disabled={loading}
            style={{ width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: 'white', marginTop: '10px' }}
          >
            {loading ? 'Generating Plan...' : 'Generate 3-Day Plan'}
          </button>
        </div>

        {weeklyPlan.length > 0 && (
          <div style={{ marginTop: '30px' }}>
            <h3>Your Generated Plan ({preference.toUpperCase()})</h3>
            <div style={{ display: 'grid', gap: '15px' }}>
              {weeklyPlan.map(dayPlan => (
                <div key={dayPlan.day} style={{ border: '1px solid #d1d5db', padding: '15px', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                  <h4>{dayPlan.day}</h4>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {/* Maps over breakfast, lunch, dinner */}
                    {Object.entries(dayPlan).filter(([key]) => key !== 'day').map(([mealTime, meal]) => (
                      <li key={meal.id + mealTime} style={{ marginBottom: '8px' }}>
                        <strong style={{ textTransform: 'capitalize', color: '#ef4444' }}>{mealTime}:</strong> {meal.name} 
                        <span style={{ float: 'right', fontSize: '0.9rem', color: '#666' }}>({meal.cals} kcal)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MealPlannerPage;