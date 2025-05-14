import { pgTable, text, serial, integer, boolean, json, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User profile table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  telegramId: text("telegram_id").unique(),
  age: integer("age"),
  gender: text("gender"),
  weight: real("weight"),
  height: real("height"),
  activity: text("activity"),
  goal: text("goal"),
  budget: real("budget"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Food items table
export const foodItems = pgTable("food_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  calories: real("calories").notNull(),
  protein: real("protein").notNull(),
  fat: real("fat").notNull(),
  carbs: real("carbs").notNull(),
  pricePerUnit: real("price_per_unit").notNull(),
  unit: text("unit").notNull(),
  quantity: real("quantity").notNull(),
});

// Meal table
export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // breakfast, lunch, dinner, snack
  day: integer("day").notNull(),
  calories: real("calories").notNull(),
  protein: real("protein").notNull(),
  fat: real("fat").notNull(),
  carbs: real("carbs").notNull(),
  recipe: text("recipe"),
  imageUrl: text("image_url"),
  ingredients: json("ingredients").notNull(), // Array of ingredient IDs with quantities
});

// Meal plans table
export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  days: integer("days").notNull(),
  totalCalories: real("total_calories").notNull(),
  totalProtein: real("total_protein").notNull(),
  totalFat: real("total_fat").notNull(),
  totalCarbs: real("total_carbs").notNull(),
  totalCost: real("total_cost").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Grocery items table
export const groceryItems = pgTable("grocery_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  foodItemId: integer("food_item_id").notNull().references(() => foodItems.id),
  quantity: real("quantity").notNull(),
  purchased: boolean("purchased").default(false),
  mealPlanId: integer("meal_plan_id").references(() => mealPlans.id),
});

// Stores table
export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  rating: real("rating"),
  reviewCount: integer("review_count"),
  imageUrl: text("image_url"),
});

// Creating Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertFoodItemSchema = createInsertSchema(foodItems).omit({
  id: true,
});

export const insertMealSchema = createInsertSchema(meals).omit({
  id: true,
});

export const insertMealPlanSchema = createInsertSchema(mealPlans).omit({
  id: true,
  createdAt: true,
});

export const insertGroceryItemSchema = createInsertSchema(groceryItems).omit({
  id: true,
});

export const insertStoreSchema = createInsertSchema(stores).omit({
  id: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type FoodItem = typeof foodItems.$inferSelect;
export type InsertFoodItem = z.infer<typeof insertFoodItemSchema>;

export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;

export type MealPlan = typeof mealPlans.$inferSelect;
export type InsertMealPlan = z.infer<typeof insertMealPlanSchema>;

export type GroceryItem = typeof groceryItems.$inferSelect;
export type InsertGroceryItem = z.infer<typeof insertGroceryItemSchema>;

export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;

// Create profile schema for frontend forms
export const profileSchema = z.object({
  age: z.number().min(1).max(120),
  gender: z.enum(["male", "female", "other"]),
  weight: z.number().positive(),
  height: z.number().positive(),
  activity: z.enum(["sedentary", "light", "moderate", "high", "extreme"]),
  goal: z.enum(["lose", "maintain", "gain"]),
  budget: z.number().positive(),
});

export type Profile = z.infer<typeof profileSchema>;
