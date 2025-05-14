import { NutritionSummary } from "@/types";

interface DailyNutritionSummaryProps {
  day: number;
  nutrition: NutritionSummary;
}

export function DailyNutritionSummary({ day, nutrition }: DailyNutritionSummaryProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-300 p-3 mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-neutral-900">День {day}</h3>
        <div className="text-sm text-neutral-600">
          <span className="font-medium">{nutrition.calories}</span> ккал
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="text-xs text-neutral-600">Белки</div>
          <div className="text-sm font-semibold text-neutral-900">{nutrition.protein}г</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-neutral-600">Жиры</div>
          <div className="text-sm font-semibold text-neutral-900">{nutrition.fat}г</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-neutral-600">Углеводы</div>
          <div className="text-sm font-semibold text-neutral-900">{nutrition.carbs}г</div>
        </div>
      </div>
      
      {nutrition.budget && (
        <div className="mt-2 text-xs flex justify-between">
          <span className="text-neutral-600">Стоимость:</span>
          <span className="font-medium text-neutral-900">{nutrition.budget}₽</span>
        </div>
      )}
    </div>
  );
}
