import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { DailyNutritionSummary } from "@/components/meals/DailyNutritionSummary";
import { MealCard } from "@/components/meals/MealCard";
import { useMealPlan } from "@/hooks/use-meal-plan";
import { useProfile } from "@/hooks/use-profile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { showAlert, sendDataToTelegram, showMainButton, hapticFeedback, expandApp } from "@/lib/telegram";
import type { MealPlan, DailyMeals } from "@/types";
import { useParams } from 'react-router-dom';
import axios from 'axios';

const MealPlanPage: React.FC = () => {
  const { userId: urlUserId } = useParams<{ userId: string }>();
  
  // Получаем userId из параметров URL или из Telegram WebApp
  const userId = urlUserId ? parseInt(urlUserId) : (window.Telegram?.WebApp?.initDataUnsafe?.user?.id || undefined);

  const { profile } = useProfile();
  const {
    mealPlan,
    dailyMeals,
    activeDay,
    setActiveDay,
    dayCount,
    setDayCount,
    addToGroceryList,
    isLoadingMealPlan,
    isLoadingDailyMeals,
    isAddingToGroceryList,
  } = useMealPlan(userId) as {
    mealPlan: MealPlan | undefined;
    dailyMeals: DailyMeals[] | undefined;
    activeDay: number;
    setActiveDay: (day: number) => void;
    dayCount: number;
    setDayCount: (count: number) => void;
    addToGroceryList: (meal: any) => void;
    isLoadingMealPlan: boolean;
    isLoadingDailyMeals: boolean;
    isAddingToGroceryList: boolean;
  };

  const [availableDays, setAvailableDays] = useState<number[]>([1, 2, 3]);

  // Expand app when component mounts
  useEffect(() => {
    expandApp();
  }, []);

  // Update available days when day count changes and setup Telegram button
  useEffect(() => {
    if (mealPlan) {
      const days = Array.from({ length: mealPlan.days }, (_, i) => i + 1);
      setAvailableDays(days);
      
      // Показываем кнопку для отправки плана питания в Telegram
      showMainButton('Отправить план питания в Telegram', () => {
        // Создаем объект с данными о плане питания для отправки
        const mealPlanData = {
          id: mealPlan.id,
          days: mealPlan.days,
          dailyNutrition: mealPlan.dailyNutrition || currentNutrition,
          dailyMeals: Array.isArray(dailyMeals) ? dailyMeals : [currentDayMeals]
        };
        
        // Отправляем данные в Telegram
        if (sendDataToTelegram(mealPlanData, 'mealPlan')) {
          hapticFeedback.notification('success');
        }
      });
    }
    
    return () => {
      // Скрываем кнопку при размонтировании компонента
      try {
        const tgApp = window.Telegram?.WebApp;
        if (tgApp?.MainButton) {
          tgApp.MainButton.hide();
        }
      } catch (e) {
        console.warn('Error hiding Telegram button', e);
      }
    };
  }, [mealPlan, dailyMeals]);

  // Handle day count change
  const handleDayCountChange = (value: string) => {
    const count = parseInt(value, 10);
    setDayCount(count);
    // Reset to day 1 when changing day count
    setActiveDay(1);
  };

  // Handle day selection
  const handleDaySelect = (day: number) => {
    setActiveDay(day);
  };

  // Mock data for demonstration
  const mockDailyNutrition = {
    calories: 1800,
    protein: 90,
    fat: 60,
    carbs: 225,
    budget: 500,
  };

  const mockMeals: import("@/types").Meal[] = [
    {
      id: 1,
      name: "Овсянка с ягодами и йогуртом",
      type: "breakfast",
      description: "Питательный завтрак с овсянкой, сезонными ягодами и натуральным йогуртом",
      calories: 450,
      protein: 15,
      fat: 10,
      carbs: 60,
      price: 120,
      imageUrl: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
      ingredients: [
        { foodItemId: 1, quantity: 50, unit: "г" },
        { foodItemId: 2, quantity: 150, unit: "г" },
        { foodItemId: 3, quantity: 50, unit: "г" },
        { foodItemId: 4, quantity: 10, unit: "г" }
      ],
      recipe: "1. Сварите овсянку на воде. 2. Добавьте ягоды и мед. 3. Полейте йогуртом.",
    },
    {
      id: 2,
      name: "Куриный салат с овощами",
      type: "lunch",
      description: "Салат из куриной грудки, свежих овощей и заправкой из оливкового масла",
      calories: 650,
      protein: 35,
      fat: 20,
      carbs: 25,
      price: 180,
      imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
      ingredients: [
        { foodItemId: 5, quantity: 150, unit: "г" },
        { foodItemId: 6, quantity: 50, unit: "г" },
        { foodItemId: 7, quantity: 100, unit: "г" },
        { foodItemId: 8, quantity: 100, unit: "г" },
        { foodItemId: 9, quantity: 10, unit: "мл" }
      ],
      recipe: "1. Отварите куриную грудку. 2. Нарежьте овощи. 3. Смешайте все ингредиенты и заправьте маслом.",
    }
  ];

  // Use actual data if available, otherwise use mock data
  let currentDayMeals: import("@/types").Meal[];
  if (dailyMeals && Array.isArray(dailyMeals)) {
    const found = dailyMeals.find((d) => d.day === activeDay);
    currentDayMeals = found ? found.meals : [];
  } else {
    currentDayMeals = mockMeals;
  }
  const currentNutrition = mealPlan?.dailyNutrition || mockDailyNutrition;

  const handleAddToGroceryList = (meal: any) => {
    try {
      addToGroceryList(meal);
    } catch (error) {
      showAlert('Не удалось добавить в список покупок');
      console.error('Error adding to grocery list:', error);
    }
  };

  // If loading, show skeleton
  if (isLoadingMealPlan) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen pb-20 relative shadow-md">
        <Header activeTab="meal-plan" />
        
        <main className="p-4">
          <div className="mb-4 flex justify-between items-center">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-8 w-24" />
          </div>
          
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-32 w-full mb-4" />
          
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
        
        <BottomNavigation />
      </div>
    );
  }

  // If no meal plan, show message
  if (!mealPlan && !isLoadingMealPlan) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen pb-20 relative shadow-md">
        <Header activeTab="meal-plan" />
        
        <main className="p-4">
          <div className="flex flex-col items-center justify-center h-60">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-neutral-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="text-lg font-medium text-neutral-700 mb-2">План питания не найден</h3>
            <p className="text-sm text-neutral-500 text-center mb-4">
              Создайте свой профиль и сгенерируйте план питания на главной странице
            </p>
            <Button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-primary text-white rounded-md"
            >
              Перейти на главную
            </Button>
          </div>
        </main>
        
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-20 relative shadow-md">
      <Header activeTab="meal-plan" />
      
      <main className="p-4">
        {/* Days selector */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold text-neutral-900">План питания</h2>
            <div className="flex items-center">
              <label htmlFor="days" className="text-sm font-medium text-neutral-700 mr-2">Дней:</label>
              <Select
                value={dayCount.toString()}
                onValueChange={handleDayCountChange}
              >
                <SelectTrigger className="px-2 py-1 border border-neutral-300 rounded-md shadow-sm text-sm w-20">
                  <SelectValue placeholder="Выберите" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="7">7</SelectItem>
                  <SelectItem value="14">14</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex overflow-x-auto py-2 mb-2 -mx-1 scrollbar-hide" id="days-selector">
            {availableDays.map((day) => (
              <Button
                key={day}
                className={`mx-1 min-w-[4.5rem] px-3 py-2 whitespace-nowrap ${
                  activeDay === day
                    ? 'bg-primary text-white'
                    : 'bg-white border border-neutral-300 text-neutral-700'
                }`}
                onClick={() => handleDaySelect(day)}
              >
                День {day}
              </Button>
            ))}
          </div>
          
          {/* Nutrition summary for selected day */}
          <DailyNutritionSummary day={activeDay} nutrition={currentNutrition} />
        </div>
        
        {/* Meals for the day */}
        <div className="space-y-4" id="daily-meals">
          {isLoadingDailyMeals ? (
            <>
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </>
          ) : (
            currentDayMeals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                onAddToGroceryList={handleAddToGroceryList}
              />
            ))
          )}
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
}

export default MealPlanPage;
