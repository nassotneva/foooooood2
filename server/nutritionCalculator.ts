import { Profile } from "@shared/schema";
import { storage } from "./storage";

// Функция для генерации плана питания на основе профиля и пользовательского ID
export async function generateNutritionPlan(profile: Profile, userId: number) {
  // Расчет BMR (базальный метаболический уровень) по формуле Харриса-Бенедикта
  let bmr = 0;
  
  if (profile.gender === 'male') {
    // Мужчины: BMR = 88.362 + (13.397 × вес в кг) + (4.799 × рост в см) - (5.677 × возраст)
    bmr = 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age);
  } else {
    // Женщины: BMR = 447.593 + (9.247 × вес в кг) + (3.098 × рост в см) - (4.330 × возраст)
    bmr = 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age);
  }
  
  // Применяем коэффициент активности
  let tdee = 0; // Полная суточная затрата энергии
  switch (profile.activity) {
    case 'sedentary':
      tdee = bmr * 1.2;
      break;
    case 'light':
      tdee = bmr * 1.375;
      break;
    case 'moderate':
      tdee = bmr * 1.55;
      break;
    case 'high':
      tdee = bmr * 1.725;
      break;
    case 'extreme':
      tdee = bmr * 1.9;
      break;
  }
  
  // Корректируем в соответствии с целью
  let targetCalories = 0;
  switch (profile.goal) {
    case 'lose':
      targetCalories = tdee * 0.8; // 20% дефицит
      break;
    case 'maintain':
      targetCalories = tdee;
      break;
    case 'gain':
      targetCalories = tdee * 1.15; // 15% излишек
      break;
  }
  
  // Рассчитываем макронутриенты
  // Белок: 2г на кг веса тела
  const protein = profile.weight * 2;
  // Жиры: 30% от общих калорий
  const fat = (targetCalories * 0.3) / 9;
  // Углеводы: оставшиеся калории
  const carbs = (targetCalories - (protein * 4) - (fat * 9)) / 4;
  
  // Получаем продукты для создания блюд
  const foodItems = await storage.getAllFoodItems();
  
  // Рассчитываем дневной бюджет на питание
  const dailyBudget = profile.budget || 500; // По умолчанию 500, если не указано
  
  // Создаем план питания
  const mealPlan = await storage.createMealPlan({
    userId,
    days: 3, // По умолчанию 3 дня
    totalCalories: Math.round(targetCalories),
    totalProtein: Math.round(protein),
    totalFat: Math.round(fat),
    totalCarbs: Math.round(carbs),
    totalCost: dailyBudget * 3 // Бюджет на 3 дня
  });
  
  // Возвращаем рассчитанный план питания
  return {
    mealPlan,
    dailyNutrition: {
      calories: Math.round(targetCalories),
      protein: Math.round(protein),
      fat: Math.round(fat),
      carbs: Math.round(carbs),
      budget: dailyBudget
    }
  };
}