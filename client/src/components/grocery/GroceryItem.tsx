import { Minus, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface GroceryItemProps {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  category: string;
  purchased: boolean;
  onUpdatePurchased: (id: number, purchased: boolean) => void;
  onUpdateQuantity: (id: number, quantity: number) => void;
}

export function GroceryItem({
  id,
  name,
  quantity,
  unit,
  price,
  category,
  purchased,
  onUpdatePurchased,
  onUpdateQuantity,
}: GroceryItemProps) {
  const handleQuantityChange = (amount: number) => {
    const newQuantity = Math.max(1, quantity + amount);
    onUpdateQuantity(id, newQuantity);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-neutral-300 px-3 py-2 flex items-center justify-between"
      data-category={category}
    >
      <div className="flex items-center">
        <Checkbox
          id={`item-${id}`}
          checked={purchased}
          onCheckedChange={(checked) => onUpdatePurchased(id, checked === true)}
          className="mr-3 h-4 w-4 text-primary border-neutral-300 rounded"
        />
        <label htmlFor={`item-${id}`} className="flex flex-col">
          <span className={`text-neutral-900 font-medium ${purchased ? 'line-through' : ''}`}>
            {name}
          </span>
          <span className="text-xs text-neutral-600">
            {quantity}{unit} - {price}₽
          </span>
        </label>
      </div>
      
      <div className="flex items-center">
        <div className="flex items-center mr-2">
          <button 
            className="w-6 h-6 rounded border border-neutral-300 bg-white text-neutral-800 flex items-center justify-center text-xs"
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="px-2 text-sm">{quantity}</span>
          <button 
            className="w-6 h-6 rounded border border-neutral-300 bg-white text-neutral-800 flex items-center justify-center text-xs"
            onClick={() => handleQuantityChange(1)}
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
