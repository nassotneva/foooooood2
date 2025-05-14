import { 
  users, 
  foodItems, 
  meals, 
  mealPlans, 
  groceryItems, 
  stores,
  type User, 
  type InsertUser,
  type FoodItem,
  type InsertFoodItem,
  type Meal,
  type InsertMeal,
  type MealPlan,
  type InsertMealPlan,
  type GroceryItem,
  type InsertGroceryItem,
  type Store,
  type InsertStore
} from "@shared/schema";
import { db } from "./db";
import { eq, and, isNull, isNotNull, inArray } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Food items methods
  getFoodItem(id: number): Promise<FoodItem | undefined>;
  getFoodItemsByCategory(category: string): Promise<FoodItem[]>;
  getAllFoodItems(): Promise<FoodItem[]>;
  createFoodItem(item: InsertFoodItem): Promise<FoodItem>;
  
  // Meal methods
  getMeal(id: number): Promise<Meal | undefined>;
  getMealsByUserAndDay(userId: number, day: number): Promise<Meal[]>;
  createMeal(meal: InsertMeal): Promise<Meal>;
  
  // Meal plan methods
  getMealPlan(id: number): Promise<MealPlan | undefined>;
  getMealPlanByUser(userId: number): Promise<MealPlan | undefined>;
  createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan>;
  
  // Grocery items methods
  getGroceryItems(userId: number): Promise<GroceryItem[]>;
  getGroceryItemsWithDetails(userId: number): Promise<any[]>;
  createGroceryItem(item: InsertGroceryItem): Promise<GroceryItem>;
  updateGroceryItem(id: number, purchased: boolean): Promise<GroceryItem | undefined>;
  
  // Store methods
  getStore(id: number): Promise<Store | undefined>;
  getNearbyStores(lat: number, lng: number, radius: number): Promise<Store[]>;
  getAllStores(): Promise<Store[]>;
  createStore(store: InsertStore): Promise<Store>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Food items methods
  async getFoodItem(id: number): Promise<FoodItem | undefined> {
    const [item] = await db.select().from(foodItems).where(eq(foodItems.id, id));
    return item;
  }

  async getFoodItemsByCategory(category: string): Promise<FoodItem[]> {
    return db.select().from(foodItems).where(eq(foodItems.category, category));
  }

  async getAllFoodItems(): Promise<FoodItem[]> {
    return db.select().from(foodItems);
  }

  async createFoodItem(item: InsertFoodItem): Promise<FoodItem> {
    const [newItem] = await db.insert(foodItems).values(item).returning();
    return newItem;
  }

  // Meal methods
  async getMeal(id: number): Promise<Meal | undefined> {
    const [meal] = await db.select().from(meals).where(eq(meals.id, id));
    return meal;
  }

  async getMealsByUserAndDay(userId: number, day: number): Promise<Meal[]> {
    return db
      .select()
      .from(meals)
      .where(and(eq(meals.userId, userId), eq(meals.day, day)));
  }

  async createMeal(meal: InsertMeal): Promise<Meal> {
    const [newMeal] = await db.insert(meals).values(meal).returning();
    return newMeal;
  }

  // Meal plan methods
  async getMealPlan(id: number): Promise<MealPlan | undefined> {
    const [plan] = await db.select().from(mealPlans).where(eq(mealPlans.id, id));
    return plan;
  }

  async getMealPlanByUser(userId: number): Promise<MealPlan | undefined> {
    const [plan] = await db
      .select()
      .from(mealPlans)
      .where(eq(mealPlans.userId, userId))
      .orderBy(mealPlans.createdAt);
    return plan;
  }

  async createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan> {
    const [newPlan] = await db.insert(mealPlans).values(mealPlan).returning();
    return newPlan;
  }

  // Grocery items methods
  async getGroceryItems(userId: number): Promise<GroceryItem[]> {
    return db.select().from(groceryItems).where(eq(groceryItems.userId, userId));
  }

  async getGroceryItemsWithDetails(userId: number): Promise<any[]> {
    // Join with foodItems to get full details
    const result = await db
      .select({
        id: groceryItems.id,
        userId: groceryItems.userId,
        foodItemId: groceryItems.foodItemId,
        quantity: groceryItems.quantity,
        purchased: groceryItems.purchased,
        mealPlanId: groceryItems.mealPlanId,
        foodItem: {
          id: foodItems.id,
          name: foodItems.name,
          category: foodItems.category,
          calories: foodItems.calories,
          protein: foodItems.protein,
          fat: foodItems.fat,
          carbs: foodItems.carbs,
          pricePerUnit: foodItems.pricePerUnit,
          unit: foodItems.unit,
          quantity: foodItems.quantity
        }
      })
      .from(groceryItems)
      .innerJoin(foodItems, eq(groceryItems.foodItemId, foodItems.id))
      .where(eq(groceryItems.userId, userId));
    
    return result;
  }

  async createGroceryItem(item: InsertGroceryItem): Promise<GroceryItem> {
    const [newItem] = await db.insert(groceryItems).values(item).returning();
    return newItem;
  }

  async updateGroceryItem(id: number, purchased: boolean): Promise<GroceryItem | undefined> {
    const [updated] = await db
      .update(groceryItems)
      .set({ purchased })
      .where(eq(groceryItems.id, id))
      .returning();
    return updated;
  }

  // Store methods
  async getStore(id: number): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.id, id));
    return store;
  }

  async getNearbyStores(lat: number, lng: number, radius: number): Promise<Store[]> {
    // Simple distance calculation for demonstration purposes
    // In production, you would use PostGIS or similar for geospatial queries
    const allStores = await this.getAllStores();
    return allStores.filter(store => {
      const distance = Math.sqrt(
        Math.pow(store.latitude - lat, 2) + Math.pow(store.longitude - lng, 2)
      );
      // Convert to approx kilometers (this is a simplified calculation)
      const distanceKm = distance * 111;
      return distanceKm <= radius;
    });
  }

  async getAllStores(): Promise<Store[]> {
    return db.select().from(stores);
  }

  async createStore(store: InsertStore): Promise<Store> {
    const [newStore] = await db.insert(stores).values(store).returning();
    return newStore;
  }
}

export const storage = new DatabaseStorage();
