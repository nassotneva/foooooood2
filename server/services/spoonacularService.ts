import { SpoonacularProduct, SpoonacularSearchResponse, SpoonacularRecipe, SpoonacularProductSearch, SpoonacularProductInformation, SpoonacularMealPlanResponse } from '@shared/types/spoonacular';
import { FoodItem, InsertFoodItem } from '@shared/schema';

// Исправленный базовый URL
const API_BASE_URL = 'https://api.spoonacular.com';
const API_KEY = process.env.SPOONACULAR_API_KEY;

if (!API_KEY) {
  throw new Error('SPOONACULAR_API_KEY is not defined in environment variables');
}

export class SpoonacularService {
  private static async fetchFromAPI(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    queryParams.append('apiKey', API_KEY!);
    Object.keys(params).forEach(key => {
      queryParams.append(key, params[key]);
    });

    const response = await fetch(`${API_BASE_URL}${endpoint}?${queryParams}`);
    if (!response.ok) {
      throw new Error(`Spoonacular API error: ${response.statusText}`);
    }
    return response.json();
  }

  static async searchRecipes(query: string, page: number = 1, pageSize: number = 24): Promise<SpoonacularSearchResponse> {
    return this.fetchFromAPI('/recipes/complexSearch', {
      query,
      offset: ((page - 1) * pageSize).toString(),
      number: pageSize.toString(),
      addRecipeInformation: 'true',
      fillIngredients: 'true',
      instructionsRequired: 'true'
    });
  }

  static async getRecipeById(id: number): Promise<SpoonacularRecipe> {
    return this.fetchFromAPI(`/recipes/${id}/information`, {
      addRecipeInformation: 'true',
      fillIngredients: 'true',
      instructionsRequired: 'true'
    });
  }

  static async searchByIngredients(ingredients: string[], number: number = 5): Promise<SpoonacularRecipe[]> {
    return this.fetchFromAPI('/recipes/findByIngredients', {
      ingredients: ingredients.join(','),
      number: number.toString(),
      ranking: '1',
      ignorePantry: 'true'
    });
  }

  static async searchGroceryProducts(query: string, page: number = 1, pageSize: number = 10): Promise<SpoonacularProductSearch[]> {
    const response = await this.fetchFromAPI('/food/products/search', {
      query,
      offset: ((page - 1) * pageSize).toString(),
      number: pageSize.toString(),
    });
    return response.products;
  }

  static async getGroceryProductById(id: number): Promise<SpoonacularProductInformation> {
    return this.fetchFromAPI(`/food/products/${id}`);
  }

  static convertToFoodItem(recipeOrProduct: SpoonacularRecipe | SpoonacularProductInformation): InsertFoodItem {
    let name = '';
    let category = 'other';
    let calories = 0;
    let protein = 0;
    let fat = 0;
    let carbs = 0;
    let pricePerUnit = 0;
    let unit = 'serving';
    let quantity = 1;

    if ('dishTypes' in recipeOrProduct) { // Это рецепт
      const recipe = recipeOrProduct as SpoonacularRecipe;
      name = recipe.title;
      const nutrients = (recipe as any).nutrition?.nutrients || [];
      calories = nutrients.find((n: any) => n.name === 'Calories')?.amount || 0;
      protein = nutrients.find((n: any) => n.name === 'Protein')?.amount || 0;
      fat = nutrients.find((n: any) => n.name === 'Fat')?.amount || 0;
      carbs = nutrients.find((n: any) => n.name === 'Carbohydrates')?.amount || 0;
      pricePerUnit = recipe.pricePerServing || 0;
      unit = 'serving';
      quantity = recipe.servings || 1;
      if (recipe.dishTypes?.some(type => type.includes('breakfast'))) { category = 'breakfast'; }
      else if (recipe.dishTypes?.some(type => type.includes('main course'))) { category = 'main'; }
      else if (recipe.dishTypes?.some(type => type.includes('dessert'))) { category = 'dessert'; }
      else if (recipe.dishTypes?.some(type => type.includes('snack'))) { category = 'snack'; }

    } else { // Это продукт
      const product = recipeOrProduct as SpoonacularProductInformation;
      name = product.title;
      const nutrients = product.nutrition?.nutrients || [];
      calories = nutrients.find(n => n.name === 'Calories')?.amount || 0;
      protein = nutrients.find(n => n.name === 'Protein')?.amount || 0;
      fat = nutrients.find(n => n.name === 'Fat')?.amount || 0;
      carbs = nutrients.find(n => n.name === 'Carbohydrates')?.amount || 0;
      pricePerUnit = product.price || 0;
      unit = 'item'; // Или более точная единица, если доступна
      quantity = 1; // Или количество в упаковке, если доступно
      category = 'product'; // Или определяем категорию по названию/другим полям
    }

    return {
      name,
      category,
      calories,
      protein,
      fat,
      carbs,
      pricePerUnit,
      unit,
      quantity
    };
  }

  static async generateMealPlan(calories: number, diet?: string, exclude?: string[]): Promise<SpoonacularMealPlanResponse> {
    if (typeof calories !== 'number' || isNaN(calories) || calories <= 0) {
      throw new Error('Calories value is required and must be a positive number for meal plan generation');
    }
    const params: Record<string, string> = {
      targetCalories: calories.toString(),
      timeFrame: 'day'
    };

    if (diet) {
      params.diet = diet;
    }

    if (exclude?.length) {
      params.exclude = exclude.join(',');
    }

    const response = await this.fetchFromAPI('/mealplanner/generate', params);
    // Spoonacular meal planner returns an object with a 'meals' array and 'nutrients'
    return response as SpoonacularMealPlanResponse;
  }
} 