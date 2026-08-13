'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LuPlus, LuTrash2 } from 'react-icons/lu';
import { getCurrencySymbol } from '@/lib/currency';

export interface SplitItemInput {
  id: string;
  itemName: string;
  category: string;
  amount: string;
}

interface PurchaseBreakdownEditorProps {
  items: SplitItemInput[];
  onChange: (items: SplitItemInput[]) => void;
  currency: string | null;
  categories: string[];
}

export default function PurchaseBreakdownEditor({
  items,
  onChange,
  currency,
  categories,
}: PurchaseBreakdownEditorProps) {
  const currencySymbol = getCurrencySymbol(currency);

  const addItem = () => {
    const newItem: SplitItemInput = {
      id: crypto.randomUUID(),
      itemName: '',
      category: categories[0] || 'General',
      amount: '',
    };
    onChange([...items, newItem]);
  };

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof SplitItemInput, value: string) => {
    onChange(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const totalSum = items.reduce(
    (acc, item) => acc + (parseFloat(item.amount) || 0),
    0,
  );

  const isItemIncomplete = (item: SplitItemInput) => {
    const hasName = item.itemName.trim().length > 0;
    const parsedAmount = parseFloat(item.amount);
    const hasAmount = !isNaN(parsedAmount) && parsedAmount > 0;
    return (hasName && !hasAmount) || (!hasName && hasAmount);
  };

  return (
    <div className="space-y-3 pt-2 border-t border-border/50">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          Items
        </span>
        <span className="text-xs font-semibold text-primary">
          Sum: {currencySymbol}
          {totalSum.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-2 text-center">
          No items added yet. Click &quot;+ Add Item&quot; to breakdown store purchases.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => {
            const isIncomplete = isItemIncomplete(item);
            return (
              <div
                key={item.id}
                className={`flex flex-col gap-2 rounded-md border p-2.5 transition-colors ${
                  isIncomplete
                    ? 'border-destructive/80 bg-destructive/5'
                    : 'border-border/60 bg-card'
                }`}
              >
                {/* Row 1: Item Name & Delete Button */}
                <div className="flex items-center gap-2 w-full">
                  <Input
                    type="text"
                    placeholder={`Item ${idx + 1} name (e.g. Choco)`}
                    value={item.itemName}
                    onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
                    className="h-8 text-xs bg-background flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <LuTrash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Row 2: Category & Amount Fields */}
                <div className="flex items-center gap-2 w-full">
                  <div className="flex-1">
                    <Select
                      value={item.category}
                      onValueChange={(val) => updateItem(item.id, 'category', val)}
                    >
                      <SelectTrigger className="h-8 text-xs bg-background capitalize w-full">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General" className="text-xs">General</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-xs capitalize">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                      {currencySymbol}
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={item.amount}
                      onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                      className="h-8 text-xs pl-7 bg-background w-full"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addItem}
        className="w-full h-8 text-xs flex items-center justify-center gap-1.5 border-dashed"
      >
        <LuPlus className="h-3.5 w-3.5" />
        <span>Add Item</span>
      </Button>
    </div>
  );
}
