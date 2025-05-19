import { Profile, FoodItem } from "@shared/schema";
import { storage } from "./storage";
import { SpoonacularService } from "./services/spoonacularService";
import { SpoonacularRecipe } from "@shared/types/spoonacular";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

const LOCAL_KEYS = {
  calories: 'calories',
  protein: 'protein',
  fat: 'fat',
  carbs: 'carbs',
};
const OFF_KEYS = {
  calories: 'energy-kcal_100g',
  protein: 'proteins_100g',
  fat: 'fat_100g',
  carbs: 'carbohydrates_100g',
};

// Функция для генерации плана питания на основе профиля и пользовательского ID
export async function generateNutritionPlan(profile: Profile, userId: number) {
  try {
    return await withTimeout(_generateNutritionPlan(profile, userId), 10000); // 10 секунд
  } catch (err) {
    if (err instanceof Error && err.message === 'Timeout') {
      // Fallback: если таймаут — пробуем сразу локальную базу
      const fallback = await _generateNutritionPlan(profile, userId, true);
      if (fallback) return fallback;
      throw { status: 504, message: 'Внешний сервис Open Food Facts не отвечает, и нет локальных продуктов.' };
    }
    throw { status: 500, message: 'Ошибка генерации плана питания.' };
  }
}

async function _generateNutritionPlan(profile: Profile, userId: number, forceLocal = false) {
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
  
  let localProducts: FoodItem[] = [];
  localProducts = await storage.getAllFoodItems();
  
  if (localProducts.length === 0) {
    throw { status: 500, message: 'Нет доступных продуктов в локальной базе для генерации плана питания.' };
  }

  function greedyPick(
    target: number,
    key: 'calories' | 'protein' | 'fat' | 'carbs',
    used: Set<string | number>
  ): FoodItem[] {
    let sum = 0;
    const picked: FoodItem[] = [];
    const source = localProducts;
    for (const p of source) {
      const code = p.id;
      if (used.has(code)) continue;
      let value = p[key];

      if (sum + value <= target * 1.1) {
        picked.push(p);
        used.add(code);
        sum += value;
        if (sum >= target * 0.9) break;
      }
    }
    if (picked.length === 0 && source.length > 0) {
      const fallback = source.find(p => !used.has(p.id));
      if (fallback) {
        picked.push(fallback);
        used.add(fallback.id);
      }
    }
    return picked;
  }

  // Для каждого блюда подбираем ингредиенты из локальной базы
  const mealTypes = [
    { type: 'breakfast', name: 'Завтрак', target: targetCalories / 3 },
    { type: 'lunch', name: 'Обед', target: targetCalories / 3 },
    { type: 'dinner', name: 'Ужин', target: targetCalories / 3 }
  ];
  const usedIds = new Set<number>();

  const meals = mealTypes.map((meal, idx) => {
    const ingredientsRaw = greedyPick(meal.target, 'calories', usedIds).slice(0, 3);
    const ingredients = ingredientsRaw.map(ing => ({
      name: ing.name,
      amount: ing.quantity,
      unit: ing.unit
    }));

    const sum = (nutrient: 'calories' | 'protein' | 'fat' | 'carbs') =>
      ingredientsRaw.reduce((acc, p) => acc + p[nutrient], 0);

    const description = ingredients.map(ing => ing.name).join(', ');

    return {
      id: idx + 1,
      name: `${meal.name} с ${ingredients[0]?.name || 'продуктами'}`,
      type: meal.type,
      description,
      calories: Math.round(sum('calories')),
      protein: Math.round(sum('protein')),
      fat: Math.round(sum('fat')),
      carbs: Math.round(sum('carbs')),
      price: ingredientsRaw.reduce((acc, ing) => acc + ing.pricePerUnit, 0),
      imageUrl: '',
      ingredients,
      recipe: undefined
    };
  });

  // Возвращаем рассчитанный план питания и блюда
  const dailyNutrition = {
    calories: Math.round(targetCalories),
    protein: Math.round(profile.weight * 2),
    fat: Math.round((targetCalories * 0.3) / 9),
    carbs: Math.round((targetCalories - (profile.weight * 2 * 4) - (((targetCalories * 0.3) / 9) * 9)) / 4),
    budget: profile.budget || 500
  };

  return {
    dailyNutrition,
    meals
  };
}