import { Meal } from "@/types";
import { Paperclip, ShoppingCart } from "lucide-react";

interface MealCardProps {
  meal: Meal;
  onAddToGroceryList: (meal: Meal) => void;
}

export function MealCard({ meal, onAddToGroceryList }: MealCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-300 overflow-hidden mb-4">
      <div className="bg-primary-light bg-opacity-20 px-4 py-2 flex justify-between items-center">
        <h3 className="font-medium text-neutral-900">{mealTypeToRussian(meal.type)}</h3>
        <span className="text-sm text-neutral-700">{meal.calories} ккал</span>
      </div>
      
      <div className="px-4 py-3">
        <div className="flex items-start gap-3 mb-3">
          {meal.imageUrl && (
            <img 
              src={meal.imageUrl} 
              alt={meal.name} 
              className="w-20 h-20 rounded-md object-cover" 
            />
          )}
          
          <div className="flex-1">
            <h4 className="font-medium text-neutral-900 mb-1">{meal.name}</h4>
            <p className="text-sm text-neutral-600 mb-1">{meal.description}</p>
            <div className="flex justify-between text-xs">
              <span>Б: {meal.protein}г</span>
              <span>Ж: {meal.fat}г</span>
              <span>У: {meal.carbs}г</span>
              <span className="font-medium text-primary">{meal.price}₽</span>
            </div>
          </div>
        </div>
        
        <div className="text-sm font-medium text-neutral-800 my-2">Ингредиенты:</div>
        <ul className="text-sm text-neutral-600 space-y-1 mb-3">
          {meal.ingredients.map((ingredient, index) => (
            <li key={index} className="flex justify-between">
              <span>{ingredient.name}</span>
              <span>{ingredient.quantity}{ingredient.unit} - {ingredient.price}₽</span>
            </li>
          ))}
        </ul>
        
        <div className="flex gap-2">
          {meal.recipe && (
            <button className="text-xs py-1 px-2 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-100 flex items-center">
              <Paperclip className="h-3.5 w-3.5 mr-1" />
              Рецепт
            </button>
          )}
          
          <button 
            className="text-xs py-1 px-2 rounded border border-primary text-primary hover:bg-primary hover:text-white flex items-center"
            onClick={() => onAddToGroceryList(meal)}
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1" />
            В список
          </button>
        </div>
      </div>
    </div>
  );
}

function mealTypeToRussian(type: string): string {
  switch (type) {
    case 'breakfast':
      return 'Завтрак';
    case 'lunch':
      return 'Обед';
    case 'dinner':
      return 'Ужин';
    case 'snack':
      return 'Перекус';
    default:
      return type;
  }
}
