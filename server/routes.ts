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
      const { query, page = '1', pageSize = '24' } = req.query;
      if (!query) {
        return res.status(400).json({ message: "Query parameter is required" });
      }
      const recipes = await SpoonacularService.searchRecipes(
        query as string,
        parseInt(page as string),
        parseInt(pageSize as string)
      );
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
