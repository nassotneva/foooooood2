// Telegram specific types
export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id: string;
    user: TelegramUser;
    auth_date: string;
    hash: string;
  };
  version: string;
  platform: string;
  colorScheme: string;
  themeParams: {
    bg_color: string;
    text_color: string;
    hint_color: string;
    link_color: string;
    button_color: string;
    button_text_color: string;
    secondary_bg_color: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  isClosingConfirmationEnabled: boolean;
  headerColor: string;
  backgroundColor: string;
  ready(): void;
  expand(): void;
  close(): void;
  sendData(data: string): void;
  showAlert(message: string): void;
  showConfirm(message: string): Promise<boolean>;
  MainButton: TelegramMainButton;
  BackButton: TelegramBackButton;
  HapticFeedback: TelegramHapticFeedback;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramMainButton {
  text: string;
  color: string;
  textColor: string;
  isVisible: boolean;
  isActive: boolean;
  isProgressVisible: boolean;
  setText(text: string): void;
  onClick(callback: () => void): void;
  offClick(callback: () => void): void;
  show(): void;
  hide(): void;
  enable(): void;
  disable(): void;
  showProgress(leaveActive: boolean): void;
  hideProgress(): void;
}

export interface TelegramBackButton {
  isVisible: boolean;
  onClick(callback: () => void): void;
  offClick(callback: () => void): void;
  show(): void;
  hide(): void;
}

export interface TelegramHapticFeedback {
  impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
  notificationOccurred(type: 'error' | 'success' | 'warning'): void;
  selectionChanged(): void;
}

// Application specific types
export interface Profile {
  age: number;
  gender: 'male' | 'female' | 'other';
  weight: number;
  height: number;
  activity: 'sedentary' | 'light' | 'moderate' | 'high' | 'extreme';
  goal: 'lose' | 'maintain' | 'gain';
  budget: number;
}

export interface NutritionSummary {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  budget?: number;
}

export interface Ingredient {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  price: number;
}

export interface Meal {
  id: number;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  price: number;
  imageUrl: string;
  ingredients: Ingredient[];
  recipe?: string;
}

export interface DailyMeals {
  day: number;
  nutrition: NutritionSummary;
  meals: Meal[];
}

export interface MealPlan {
  id: number;
  userId: number;
  days: number;
  dailyNutrition: NutritionSummary;
  dailyMeals: DailyMeals[];
}

export interface GroceryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  purchased: boolean;
}

export interface Store {
  id: number;
  name: string;
  address: string;
  distance: number;
  duration: number;
  rating: number;
  reviewCount: number;
  price: number;
  imageUrl: string;
  latitude: number;
  longitude: number;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface Tab {
  id: string;
  label: string;
  path: string;
}
