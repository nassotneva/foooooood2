import { NutritionSummary as NutritionSummaryType } from "@/types";
import { calculateMacroPercentages, formatMacro } from "@/lib/nutrition";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface NutritionSummaryProps {
  nutrition: NutritionSummaryType;
  onViewMealPlan: () => void;
}

export function NutritionSummary({ nutrition, onViewMealPlan }: NutritionSummaryProps) {
  const percentages = calculateMacroPercentages(nutrition);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-300 p-4 mb-4">
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center">
          <div className="text-sm text-neutral-600">Калории</div>
          <div className="text-lg font-semibold text-neutral-900">{nutrition.calories}</div>
          <div className="text-xs text-neutral-500">ккал/день</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-neutral-600">Белки</div>
          <div className="text-lg font-semibold text-neutral-900">{nutrition.protein}</div>
          <div className="text-xs text-neutral-500">г ({percentages.protein}%)</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-neutral-600">Жиры</div>
          <div className="text-lg font-semibold text-neutral-900">{nutrition.fat}</div>
          <div className="text-xs text-neutral-500">г ({percentages.fat}%)</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-neutral-600">Углеводы</div>
          <div className="text-lg font-semibold text-neutral-900">{nutrition.carbs}</div>
          <div className="text-xs text-neutral-500">г ({percentages.carbs}%)</div>
        </div>
      </div>
      
      <Progress value={percentages.protein} className="bg-neutral-200 h-2.5 mb-1">
        <div className="bg-primary h-2.5 rounded-full" style={{ width: `${percentages.protein}%` }}></div>
      </Progress>
      
      <Progress value={percentages.fat} className="bg-neutral-200 h-2.5 mb-1">
        <div className="bg-secondary h-2.5 rounded-full" style={{ width: `${percentages.fat}%` }}></div>
      </Progress>
      
      <Progress value={percentages.carbs} className="bg-neutral-200 h-2.5 mb-1">
        <div className="bg-accent h-2.5 rounded-full" style={{ width: `${percentages.carbs}%` }}></div>
      </Progress>
      
      <div className="flex justify-between text-xs mt-1">
        <span className="text-primary">Белки</span>
        <span className="text-secondary">Жиры</span>
        <span className="text-accent">Углеводы</span>
      </div>
      
      <Button 
        className="w-full mt-4 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        onClick={onViewMealPlan}
      >
        Посмотреть план питания
      </Button>
    </div>
  );
}
