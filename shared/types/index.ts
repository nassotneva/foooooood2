export interface MealPlan {
  id: number;
  userId: number;
  days: number;
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  totalCost: number;
}

export interface Meal {
  id: number;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  ingredients: {
    foodItemId: number;
    quantity: number;
    unit: string;
  }[];
} 