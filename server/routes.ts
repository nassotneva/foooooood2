import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, profileSchema, insertFoodItemSchema, insertMealSchema, insertMealPlanSchema, insertGroceryItemSchema } from "@shared/schema";
import { ZodError } from "zod";
import { SpoonacularService } from "./services/spoonacularService";
import { calculateBMR, calculateTDEE, calculateCaloriesForGoal } from '../client/src/lib/nutrition';

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handler helper
  const handleError = (res: Response, error: unknown) => {
    console.error("API Error:", error);
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    return res.status(500).json({ message: "Internal server error" });
  };

  // User/Profile routes
  app.post('/api/users', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get('/api/users/:id', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get('/api/users/telegram/:telegramId', async (req, res) => {
    try {
      const telegramId = req.params.telegramId;
      console.log("Fetching user by Telegram ID:", telegramId);
      
      const user = await storage.getUserByTelegramId(telegramId);
      console.log("User found:", user);
      
      if (!user) {
        console.log("User not found for Telegram ID:", telegramId);
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user by Telegram ID:", error);
      handleError(res, error);
    }
  });

  app.patch('/api/users/:id', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const userData = req.body;
      const user = await storage.updateUser(userId, userData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Food items routes
  app.get('/api/food-items', async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const items = category 
        ? await storage.getFoodItemsByCategory(category)
        : await storage.getAllFoodItems();
      res.json(items);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get('/api/food-items/:id', async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getFoodItem(itemId);
      if (!item) {
        return res.status(404).json({ message: "Food item not found" });
      }
      res.json(item);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post('/api/food-items', async (req, res) => {
    try {
      const itemData = insertFoodItemSchema.parse(req.body);
      const item = await storage.createFoodItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Meal plan generation
  app.post('/api/meal-plans/generate', async (req, res) => {
    try {
      const { userId, profile } = req.body;
      const validatedProfile = profileSchema.parse(profile);

      // 1. Считаем BMR (базовый обмен веществ)
      let bmr = 0;
      if (validatedProfile.gender === 'male') {
        bmr = 88.362 + (13.397 * validatedProfile.weight) + (4.799 * validatedProfile.height) - (5.677 * validatedProfile.age);
      } else {
        bmr = 447.593 + (9.247 * validatedProfile.weight) + (3.098 * validatedProfile.height) - (4.330 * validatedProfile.age);
      }

      // 2. Считаем TDEE (с учетом активности)
      const activityMultipliers: Record<string, number> = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        high: 1.725,
        extreme: 1.9
      };
      const tdee = bmr * activityMultipliers[validatedProfile.activity];

      // 3. Корректируем по цели
      let targetCalories = tdee;
      if (validatedProfile.goal === 'lose') targetCalories = tdee * 0.8;
      if (validatedProfile.goal === 'gain') targetCalories = tdee * 1.15;

      if (!targetCalories || isNaN(targetCalories) || targetCalories <= 0) {
        return res.status(400).json({ message: "Не удалось рассчитать дневную калорийность профиля" });
      }

      // 4. Диета (если появится поле dietaryRestrictions, добавить обработку)
      const diet = undefined;

      const mealPlan = await SpoonacularService.generateMealPlan(
        Math.round(targetCalories),
        diet
      );

      console.log("Spoonacular meal plan response:", mealPlan); // Log 1

      // Сохраняем план в базу данных
      const savedPlan = await storage.createMealPlan({
        userId,
        days: 1,
        totalCalories: mealPlan.day?.nutrients?.calories || 0,
        totalProtein: mealPlan.day?.nutrients?.protein || 0,
        totalFat: mealPlan.day?.nutrients?.fat || 0,
        totalCarbs: mealPlan.day?.nutrients?.carbohydrates || 0,
        totalCost: mealPlan.day?.meals.reduce((sum, meal) => sum + (meal.pricePerServing || 0), 0) || 0
      });

      console.log("Saved meal plan:", savedPlan); // Log after saving main plan

      // Сохраняем детали ежедневных блюд
      console.log("Attempting to save daily meals."); // Log 2
      console.log("Checking mealPlan.day and mealPlan.day.meals:", mealPlan.day, mealPlan.day?.meals); // Added Log
      if (mealPlan.meals) {
        console.log("Number of meals received from Spoonacular:", mealPlan.meals.length); // Log 3 (исправлено)
        for (const meal of mealPlan.meals) {
          console.log("Saving meal:", meal); // Log 4 (before createMeal)
          try {
            await storage.createMeal({
              userId: savedPlan.userId, // Связываем с пользователем
              mealPlanId: savedPlan.id, // Связываем с планом питания
              spoonacularId: meal.id, // ID блюда от Spoonacular
              name: meal.title, // Название блюда (используем 'name' по схеме)
              type: meal.dishTypes?.[0] || 'main', // Тип блюда, берем первый или 'main'
              day: 1, // Предполагаем, что план всегда на 1 день
              calories: meal.nutrition?.nutrients.find((n: any) => n.name === 'Calories')?.amount || 0, // Добавляем калории
              protein: meal.nutrition?.nutrients.find((n: any) => n.name === 'Protein')?.amount || 0, // Добавляем белки
              fat: meal.nutrition?.nutrients.find((n: any) => n.name === 'Fat')?.amount || 0, // Добавляем жиры
              carbs: meal.nutrition?.nutrients.find((n: any) => n.name === 'Carbohydrates')?.amount || 0, // Добавляем углеводы
              recipe: meal.instructions, // Добавляем инструкции (рецепт)
              imageUrl: meal.image, // Добавляем изображение
              // Преобразуем ингредиенты в формат, ожидаемый схемой базы данных
              ingredients: await Promise.all((Array.isArray(meal.extendedIngredients) ? meal.extendedIngredients : []).map(async (ingredient: { id: number; name: string; nameClean: string; amount: number; unit: string; nutrition?: any }) => {
                // Ищем продукт по названию
                const existingFoodItems = await storage.getAllFoodItems(); // TODO: Оптимизировать поиск foodItems
                let foodItem = existingFoodItems.find(item => 
                  item.name.toLowerCase() === ingredient.nameClean.toLowerCase()
                );

                // Если продукт не найден, создаем новый
                if (!foodItem) {
                  console.log("Creating new food item for ingredient:", ingredient.nameClean);
                  try {
                    const newFoodItem = await storage.createFoodItem({
                      name: ingredient.nameClean || ingredient.name || 'Unnamed Ingredient',
                      category: 'other', // Можно улучшить категоризацию
                      calories: ingredient.nutrition?.nutrients?.find((n: any) => n.name === 'Calories')?.amount || 0, // Пытаемся получить нутриенты из ингредиента, если есть
                      protein: ingredient.nutrition?.nutrients?.find((n: any) => n.name === 'Protein')?.amount || 0,
                      fat: ingredient.nutrition?.nutrients?.find((n: any) => n.name === 'Fat')?.amount || 0,
                      carbs: ingredient.nutrition?.nutrients?.find((n: any) => n.name === 'Carbohydrates')?.amount || 0,
                      pricePerUnit: 0, // Нет данных о цене в ответе Spoonacular на этом уровне
                      unit: ingredient.unit || '',
                      quantity: ingredient.amount || 0
                    });
                    foodItem = newFoodItem;
                  } catch (foodItemError) {
                    console.error("Error creating food item:", ingredient.nameClean, foodItemError);
                    // Возвращаем null или пропускаем ингредиент, если не удалось создать foodItem
                    return null; 
                  }
                }

                // Проверяем, что foodItem был найден или создан
                if (!foodItem) {
                  console.warn("Could not find or create food item for ingredient:", ingredient.nameClean);
                  return null; // Пропускаем ингредиент, если foodItem не найден/создан
                }

                return {
                  foodItemId: foodItem.id,
                  quantity: ingredient.amount || 0,
                  unit: ingredient.unit || '',
                };
              })).then(ingredients => ingredients.filter(ingredient => ingredient !== null)), // Фильтруем null значения
            });
            console.log("Meal saved successfully:", meal.id); // Log 5 (success)
          } catch (saveError) {
            console.error("Error saving meal:", meal.id, saveError); // Log 6 (error)
          }
        }
      } else {
        console.log("No meals found in Spoonacular response."); // Log if meals array is empty or missing
      }

      res.status(201).json(savedPlan);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Meal routes
  app.get('/api/meals/user/:userId/day/:day', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const day = parseInt(req.params.day);
      const meals = await storage.getMealsByUserAndDay(userId, day);
      res.json(meals);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post('/api/meals', async (req, res) => {
    try {
      const mealData = insertMealSchema.parse(req.body);
      const meal = await storage.createMeal(mealData);
      res.status(201).json(meal);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Meal plan routes
  app.get('/api/meal-plans/user/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const plan = await storage.getMealPlanByUser(userId);
      if (!plan) {
        return res.status(404).json({ message: "Meal plan not found" });
      }
      res.json(plan);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post('/api/meal-plans', async (req, res) => {
    try {
      const planData = insertMealPlanSchema.parse(req.body);
      const plan = await storage.createMealPlan(planData);
      res.status(201).json(plan);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Grocery items routes
  app.get('/api/grocery-items/user/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const items = await storage.getGroceryItemsWithDetails(userId);
      res.json(items);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post('/api/grocery-items', async (req, res) => {
    try {
      const itemData = insertGroceryItemSchema.parse(req.body);
      const item = await storage.createGroceryItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch('/api/grocery-items/:id', async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const { purchased } = req.body;
      if (typeof purchased !== 'boolean') {
        return res.status(400).json({ message: "Invalid data. 'purchased' field must be a boolean." });
      }
      const item = await storage.updateGroceryItem(itemId, purchased);
      if (!item) {
        return res.status(404).json({ message: "Grocery item not found" });
      }
      res.json(item);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Import meals route
  app.get('/api/import-meals', async (req, res) => {
    try {
      const recipes = await SpoonacularService.fetchRandomRecipes();
      
      // Сохраняем каждый рецепт в базу данных
      const savedMeals = await Promise.all(recipes.map(async (recipe) => {
        // Создаем или находим продукты для каждого ингредиента
        const ingredients = await Promise.all(recipe.extendedIngredients.map(async (ingredient) => {
          // Ищем продукт по названию
          const existingFoodItems = await storage.getAllFoodItems();
          let foodItem = existingFoodItems.find(item => 
            item.name.toLowerCase() === ingredient.nameClean.toLowerCase()
          );

          // Если продукт не найден, создаем новый
          if (!foodItem) {
            const newFoodItem = await storage.createFoodItem({
              name: ingredient.nameClean,
              category: 'other', // Можно улучшить категоризацию
              calories: 0, // Нужно получить из API
              protein: 0,
              fat: 0,
              carbs: 0,
              pricePerUnit: 0,
              unit: ingredient.unit,
              quantity: 1
            });
            foodItem = newFoodItem;
          }

          return {
            foodItemId: foodItem.id,
            quantity: ingredient.amount,
            unit: ingredient.unit
          };
        }));

        // Создаем блюдо
        const meal = await storage.createMeal({
          userId: 1, // TODO: Получать из контекста пользователя
          name: recipe.title,
          type: recipe.dishTypes?.[0] || 'main', // Используем первый тип блюда или 'main' по умолчанию
          day: 1, // TODO: Определять день
          calories: recipe.nutrition.nutrients.find(n => n.name === 'Calories')?.amount || 0,
          protein: recipe.nutrition.nutrients.find(n => n.name === 'Protein')?.amount || 0,
          fat: recipe.nutrition.nutrients.find(n => n.name === 'Fat')?.amount || 0,
          carbs: recipe.nutrition.nutrients.find(n => n.name === 'Carbohydrates')?.amount || 0,
          recipe: recipe.instructions,
          imageUrl: recipe.image,
          ingredients
        });

        return meal;
      }));

      res.status(200).json({ 
        message: 'Meals imported successfully', 
        meals: savedMeals 
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Store routes
  app.get('/api/stores', async (req, res) => {
    try {
      const stores = await storage.getAllStores();
      res.json(stores);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get('/api/stores/nearby', async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      const radius = parseFloat(req.query.radius as string || "5"); // Default 5km
      
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ message: "Invalid coordinates" });
      }
      
      const stores = await storage.getNearbyStores(lat, lng, radius);
      res.json(stores);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Spoonacular API routes
  app.get('/api/recipes/search', async (req, res) => {
    try {
      const query = req.query.query as string | undefined;
      if (!query) {
        return res.status(400).json({ message: "Missing search query parameter 'query'" });
      }
      const recipes = await SpoonacularService.searchRecipes(query);
      res.json(recipes);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get('/api/recipes/:id', async (req, res) => {
    try {
      const recipeId = parseInt(req.params.id);
      const recipe = await SpoonacularService.getRecipeById(recipeId);
      res.json(recipe);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get('/api/recipes/by-ingredients', async (req, res) => {
    try {
      const { ingredients } = req.query;
      if (!ingredients || typeof ingredients !== 'string') {
        return res.status(400).json({ message: "Ingredients parameter is required" });
      }
      const recipes = await SpoonacularService.searchByIngredients(ingredients.split(','));
      res.json(recipes);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get('/api/products/search', async (req, res) => {
    try {
      const { query, page = '1', pageSize = '10' } = req.query;
      if (!query) {
        return res.status(400).json({ message: "Query parameter is required" });
      }
      const products = await SpoonacularService.searchGroceryProducts(
        query as string,
        parseInt(page as string),
        parseInt(pageSize as string)
      );
      res.json(products);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await SpoonacularService.getGroceryProductById(productId);
      res.json(product);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
