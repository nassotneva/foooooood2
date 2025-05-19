export interface SpoonacularProduct {
  id: number;
  title: string;
  image: string;
  imageType: string;
  nutrition: {
    nutrients: Array<{
      name: string;
      amount: number;
      unit: string;
      percentOfDailyNeeds: number;
    }>;
  };
  pricePerServing: number;
  servings: number;
  readyInMinutes: number;
  healthScore: number;
  spoonacularScore: number;
  analyzedInstructions: Array<{
    name: string;
    steps: Array<{
      number: number;
      step: string;
      ingredients: Array<{
        id: number;
        name: string;
        localizedName: string;
        image: string;
      }>;
    }>;
  }>;
}

export interface SpoonacularSearchResponse {
  results: SpoonacularProduct[];
  offset: number;
  number: number;
  totalResults: number;
}

export interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  imageType: string;
  servings: number;
  readyInMinutes: number;
  license: string;
  sourceName: string;
  sourceUrl: string;
  spoonacularSourceUrl: string;
  healthScore: number;
  spoonacularScore: number;
  pricePerServing: number;
  nutrition: {
    nutrients: Array<{
      name: string;
      amount: number;
      unit: string;
      percentOfDailyNeeds: number;
    }>;
  };
  analyzedInstructions: Array<{
    name: string;
    steps: Array<{
      number: number;
      step: string;
      ingredients: Array<{
        id: number;
        name: string;
        localizedName: string;
        image: string;
      }>;
    }>;
  }>;
  cheap: boolean;
  creditsText: string;
  cuisines: string[];
  dairyFree: boolean;
  diets: string[];
  gaps: string;
  glutenFree: boolean;
  instructions: string;
  ketogenic: boolean;
  lowFodmap: boolean;
  occasions: string[];
  sustainable: boolean;
  vegan: boolean;
  vegetarian: boolean;
  veryHealthy: boolean;
  veryPopular: boolean;
  whole30: boolean;
  weightWatcherSmartPoints: number;
  dishTypes: string[];
  extendedIngredients: Array<{
    id: number;
    aisle: string;
    image: string;
    consistency: string;
    name: string;
    nameClean: string;
    original: string;
    originalName: string;
    amount: number;
    unit: string;
    meta: string[];
    measures: {
      us: {
        amount: number;
        unitShort: string;
        unitLong: string;
      };
      metric: {
        amount: number;
        unitShort: string;
        unitLong: string;
      };
    };
  }>;
  summary: string;
  winePairing: {
    pairedWines: string[];
    pairingText: string;
    productMatches: Array<{
      id: number;
      title: string;
      description: string;
      price: string;
      imageUrl: string;
      averageRating: number;
      ratingCount: number;
      score: number;
      link: string;
    }>;
  };
}

export interface SpoonacularProductSearch {
  id: number;
  title: string;
  image: string;
  imageType: string;
}

export interface SpoonacularProductInformation {
  id: number;
  title: string;
  price: number;
  likes: number;
  nutrition: {
    nutrients: Array<{
      name: string;
      amount: number;
      unit: string;
    }>;
  };
  image: string;
}

export interface SpoonacularMealPlanDay {
  meals: SpoonacularRecipe[];
  nutrients: {
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
  };
}

export interface SpoonacularMealPlanResponse {
  week?: any; // Adjust as needed if you handle weekly plans
  day?: SpoonacularMealPlanDay;
} 