import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DailyMeals, Meal, MealPlan, Profile, Ingredient } from "@/types";
import { generateNutritionPlan } from "@/lib/nutrition";
import { showAlert } from "@/lib/telegram";

export function useMealPlan(userId?: number) {
  const queryClient = useQueryClient();
  const [activeDay, setActiveDay] = useState(1);
  const [dayCount, setDayCount] = useState(3); // Default 3 days
  const [isUserIdReady, setIsUserIdReady] = useState(false);

  // Устанавливаем isUserIdReady после определения userId с помощью useEffect
  useEffect(() => {
    if (userId !== undefined) {
      setIsUserIdReady(true);
    }
  }, [userId]);

  // Get meal plan
  const {
    data: mealPlan,
    isLoading: isLoadingMealPlan,
    error: mealPlanError,
    refetch: refetchMealPlan,
  } = useQuery({
    queryKey: [`/api/meal-plans/user/${userId}`],
    enabled: isUserIdReady,
  });

  // Get meals for the active day
  const {
    data: dailyMeals,
    isLoading: isLoadingDailyMeals,
    error: dailyMealsError,
    refetch: refetchDailyMeals,
  } = useQuery({
    queryKey: [`/api/meals/user/${userId}/day/${activeDay}`],
    enabled: isUserIdReady && !!mealPlan,
  });

  // Вызываем refetch dailyMeals, когда mealPlan загрузится
  useEffect(() => {
    if (isUserIdReady && mealPlan) {
      refetchDailyMeals();
    }
  }, [isUserIdReady, mealPlan, refetchDailyMeals]);

  // Generate meal plan
  const {
    mutate: generateMealPlan,
    isPending: isGenerating,
  } = useMutation({
    mutationFn: async (profile: Profile) => {
      try {
        if (!userId) {
          throw new Error("User ID is required to generate a meal plan");
        }

        const result = await generateNutritionPlan(profile, userId);
        
        // Return the generated meal plan
        return result;
      } catch (error) {
        console.error("Error generating meal plan:", error);
        if (error instanceof Error) {
          showAlert(`Failed to generate meal plan: ${error.message}`);
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/meal-plans/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/meals/user'] });
      
      // Принудительно обновляем данные плана питания после генерации
      refetchMealPlan();
      
      // Reset to day 1
      setActiveDay(1);
      
      return data;
    },
  });

  // Add all meal ingredients to grocery list
  const {
    mutate: addToGroceryList,
    isPending: isAddingToGroceryList,
  } = useMutation({
    mutationFn: async (meal: Meal) => {
      try {
        if (!userId) {
          throw new Error("User ID is required to add items to grocery list");
        }

        // Используем правильный тип для ингредиентов из Meal
        const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];
        
        const validItems = ingredients.filter(item => {
          const isValid = (
            typeof item.foodItemId === 'number' &&
            typeof item.quantity === 'number' &&
            item.quantity > 0
          );
          if (!isValid) {
            console.warn('Invalid item found:', item);
          }
          return isValid;
        });

        if (validItems.length !== ingredients.length) {
          console.warn(`Filtered out ${ingredients.length - validItems.length} invalid items`);
        }

        // Выполняем все добавления параллельно
        const addPromises = validItems.map(item =>
          apiRequest('POST', '/api/grocery-items', {
            userId,
            foodItemId: item.foodItemId,
            quantity: item.quantity,
            purchased: false,
            mealPlanId: mealPlan?.id
          }).then(response => response.json())
        );

        const results = await Promise.all(addPromises);
        
        // Валидация результатов: убедимся, что каждый результат является объектом и имеет свойство id
        const validResults = results.filter((item: any) => 
          typeof item === 'object' && item !== null && 'id' in item && typeof (item as any).id === 'number'
        );

        if (validResults.length !== results.length) {
          console.warn(`Received ${results.length - validResults.length} invalid responses`);
        }

        return validResults;
      } catch (error: unknown) {
        console.error("Error in batch add:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        showAlert(`Failed to add items: ${errorMessage}`);
        throw error;
      }
    },
    onSuccess: (data: any[]) => {
      console.log('Successfully completed batch add:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/grocery-items/user'] });
      showAlert("Items added to grocery list");
    },
  });

  return {
    mealPlan,
    dailyMeals,
    activeDay,
    setActiveDay,
    dayCount,
    setDayCount,
    generateMealPlan,
    addToGroceryList,
    isLoadingMealPlan,
    isLoadingDailyMeals,
    isGenerating,
    isAddingToGroceryList,
    error: mealPlanError || dailyMealsError,
  };
}
