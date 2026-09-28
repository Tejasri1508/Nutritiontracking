import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Trash2, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { LoadingState, EmptyState } from '@/components/ui/States';
import type { GroceryListItem } from '@/types';

export function GroceryListPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<GroceryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({ name: '', quantity: '1', category: 'other' });

  useEffect(() => {
    async function fetchItems() {
      if (!user) return;
      const { data } = await supabase.from('grocery_list_items').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setItems((data as GroceryListItem[]) || []);
      setLoading(false);
    }
    fetchItems();
  }, [user]);

  async function addItem() {
    if (!user || !newItem.name) {
      showToast('Enter an item name', 'error');
      return;
    }
    const { data, error } = await supabase.from('grocery_list_items').insert({
      user_id: user.id,
      name: newItem.name,
      quantity: newItem.quantity,
      category: newItem.category,
      checked: false,
    }).select().single();
    if (error) {
      showToast('Failed to add item', 'error');
      return;
    }
    setItems(prev => [data as GroceryListItem, ...prev]);
    setNewItem({ name: '', quantity: '1', category: 'other' });
    showToast('Item added!', 'success');
  }

  async function toggleCheck(item: GroceryListItem) {
    const { error } = await supabase.from('grocery_list_items').update({ checked: !item.checked }).eq('id', item.id);
    if (error) return;
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i));
  }

  async function deleteItem(id: string) {
    const { error } = await supabase.from('grocery_list_items').delete().eq('id', id);
    if (error) return;
    setItems(prev => prev.filter(i => i.id !== id));
  }

  const grouped = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, GroceryListItem[]>);

  const checkedCount = items.filter(i => i.checked).length;

  if (loading) return <LoadingState message="Loading grocery list..." />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Grocery List</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {items.length} items • {checkedCount} checked
        </p>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newItem.name}
            onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && addItem()}
            placeholder="Add an item..."
            className="input-field flex-1"
          />
          <input
            type="text"
            value={newItem.quantity}
            onChange={e => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
            placeholder="Qty"
            className="input-field sm:w-24"
          />
          <select value={newItem.category} onChange={e => setNewItem(prev => ({ ...prev, category: e.target.value }))} className="input-field sm:w-40">
            <option value="other">Other</option>
            <option value="produce">Produce</option>
            <option value="dairy">Dairy</option>
            <option value="meat">Meat</option>
            <option value="pantry">Pantry</option>
            <option value="recipe">From Recipe</option>
          </select>
          <button onClick={addItem} className="btn-primary flex items-center gap-2 justify-center">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="w-12 h-12" />}
          title="Your grocery list is empty"
          description="Add items manually or add ingredients from recipe pages."
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, catItems]) => (
            <div key={category} className="card">
              <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 capitalize mb-3">{category}</h3>
              <div className="space-y-2">
                {catItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3 py-2 group">
                    <button
                      onClick={() => toggleCheck(item)}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.checked ? 'bg-green-500 border-green-500' : 'border-neutral-300 dark:border-neutral-600 hover:border-green-500'}`}
                    >
                      {item.checked && <Check className="w-4 h-4 text-white" />}
                    </button>
                    <div className="flex-1">
                      <p className={`text-sm ${item.checked ? 'line-through text-neutral-400' : 'text-neutral-700 dark:text-neutral-300'}`}>{item.name}</p>
                      <p className="text-xs text-neutral-400">Qty: {item.quantity}</p>
                    </div>
                    <button onClick={() => deleteItem(item.id)} className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
