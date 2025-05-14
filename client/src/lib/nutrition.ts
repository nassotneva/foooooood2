import { NutritionSummary, Profile } from "../types";
import { apiRequest } from "./queryClient";

export function calculateBMR(profile: Profile): number {
  // Harris-Benedict Equation for BMR (Basal Metabolic Rate)
  if (profile.gender === 'male') {
    // Men: BMR = 88.362 + (13.397 × weight in kg) + (4.799 × height in cm) - (5.677 × age in years)
    return 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age);
  } else {
    // Women: BMR = 447.593 + (9.247 × weight in kg) + (3.098 × height in cm) - (4.330 × age in years)
    return 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age);
  }
}

export function calculateTDEE(bmr: number, activityLevel: Profile['activity']): number {
  // Activity multipliers
  const multipliers = {
    sedentary: 1.2,      // Little or no exercise
    light: 1.375,         // Light exercise 1-3 days/week
    moderate: 1.55,       // Moderate exercise 3-5 days/week
    high: 1.725,          // Heavy exercise 6-7 days/week
    extreme: 1.9          // Very heavy exercise, physical job or training twice a day
  };

  return bmr * multipliers[activityLevel];
}

export function calculateCaloriesForGoal(tdee: number, goal: Profile['goal']): number {
  switch (goal) {
    case 'lose':
      return tdee * 0.8; // 20% deficit for weight loss
    case 'maintain':
      return tdee; // Maintain weight
    case 'gain':
      return tdee * 1.15; // 15% surplus for weight gain
    default:
      return tdee;
  }
}

export function calculateMacros(calories: number, profile: Profile): NutritionSummary {
  // Protein: 2g per kg of bodyweight
  const protein = profile.weight * 2;
  
  // Fat: 30% of total calories
  const fat = (calories * 0.3) / 9;
  
  // Carbs: remaining calories
  const carbs = (calories - (protein * 4) - (fat * 9)) / 4;
  
  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    fat: Math.round(fat),
    carbs: Math.round(carbs),
    budget: profile.budget
  };
}

export async function generateNutritionPlan(profile: Profile, userId: number) {
  try {
    const response = await apiRequest('POST', '/api/meal-plans/generate', {
      userId,
      profile
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error generating nutrition plan:', error);
    throw error;
  }
}

export function formatMacro(value: number, unit: string = 'g'): string {
  return `${Math.round(value)}${unit}`;
}

export function calculateMacroPercentages(nutritionSummary: NutritionSummary) {
  const { protein, fat, carbs } = nutritionSummary;
  
  // Calculate total calories from macros
  const proteinCalories = protein * 4;
  const fatCalories = fat * 9;
  const carbCalories = carbs * 4;
  const totalCalories = proteinCalories + fatCalories + carbCalories;
  
  // Calculate percentages
  return {
    protein: Math.round((proteinCalories / totalCalories) * 100),
    fat: Math.round((fatCalories / totalCalories) * 100),
    carbs: Math.round((carbCalories / totalCalories) * 100)
  };
}
