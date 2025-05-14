import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DailyMeals, Meal, MealPlan, Profile } from "@/types";
import { generateNutritionPlan } from "@/lib/nutrition";
import { showAlert } from "@/lib/telegram";

export function useMealPlan(userId?: number) {
  const queryClient = useQueryClient();
  const [activeDay, setActiveDay] = useState(1);
  const [dayCount, setDayCount] = useState(3); // Default 3 days

  // Get meal plan
  const {
    data: mealPlan,
    isLoading: isLoadingMealPlan,
    error: mealPlanError,
  } = useQuery({
    queryKey: ['/api/meal-plans/user', userId],
    enabled: !!userId,
  });

  // Get meals for the active day
  const {
    data: dailyMeals,
    isLoading: isLoadingDailyMeals,
    error: dailyMealsError,
  } = useQuery({
    queryKey: ['/api/meals/user', userId, 'day', activeDay],
    enabled: !!userId && !!mealPlan,
  });

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

        // For each ingredient in the meal, add to grocery list if not already there
        const addedItems = await Promise.all(
          meal.ingredients.map(async (ingredient) => {
            const response = await apiRequest('POST', '/api/grocery-items', {
              userId,
              foodItemId: ingredient.id,
              quantity: ingredient.quantity,
              purchased: false,
              mealPlanId: mealPlan?.id
            });
            
            return response.json();
          })
        );
        
        return addedItems;
      } catch (error) {
        console.error("Error adding to grocery list:", error);
        if (error instanceof Error) {
          showAlert(`Failed to add to grocery list: ${error.message}`);
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate grocery items query
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
