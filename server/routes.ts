import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, profileSchema, insertFoodItemSchema, insertMealSchema, insertMealPlanSchema, insertGroceryItemSchema } from "@shared/schema";
import { ZodError } from "zod";
import { generateNutritionPlan } from "./nutritionCalculator";

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
      
      // Generate nutrition plan
      const plan = await generateNutritionPlan(validatedProfile, userId);
      
      res.status(201).json(plan);
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

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
