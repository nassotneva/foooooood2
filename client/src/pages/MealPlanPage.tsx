import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { MealPlan, Meal } from '../../../shared/types';
import { FoodItem } from '../../../shared/schema';

const MealPlanPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [foodItems, setFoodItems] = useState<Record<number, FoodItem>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Получаем план питания пользователя
        const planResponse = await axios.get(`/api/meal-plans/user/${userId}`);
        setMealPlan(planResponse.data);

        // Получаем блюда для текущего дня
        const mealsResponse = await axios.get(`/api/meals/user/${userId}/day/1`);
        setMeals(mealsResponse.data);

        // Получаем все продукты
        const foodItemsResponse = await axios.get('/api/food-items');
        const foodItemsMap = foodItemsResponse.data.reduce((acc: Record<number, FoodItem>, item: FoodItem) => {
          acc[item.id] = item;
          return acc;
        }, {});
        setFoodItems(foodItemsMap);
      } catch (err) {
        setError('Ошибка при загрузке плана питания');
        console.error('Error fetching meal plan:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  if (!mealPlan) {
    return <div className="text-center p-4">План питания не найден</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">План питания</h1>
      
      {/* Сводка по питательным веществам */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Общая информация</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">Калории</p>
            <p className="text-lg font-semibold">{Math.round(mealPlan.totalCalories)} ккал</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">Белки</p>
            <p className="text-lg font-semibold">{Math.round(mealPlan.totalProtein)}г</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">Жиры</p>
            <p className="text-lg font-semibold">{Math.round(mealPlan.totalFat)}г</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">Углеводы</p>
            <p className="text-lg font-semibold">{Math.round(mealPlan.totalCarbs)}г</p>
          </div>
        </div>
      </div>

      {/* Список блюд */}
      <div className="space-y-6">
        {meals.map((meal) => (
          <div key={meal.id} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">{meal.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ингредиенты */}
              <div>
                <h4 className="font-medium mb-2">Ингредиенты:</h4>
                <ul className="space-y-2">
                  {meal.ingredients?.map((ingredient, index) => (
                    <li key={index} className="flex justify-between">
                      <span>{foodItems[ingredient.foodItemId]?.name || 'Неизвестный продукт'}</span>
                      <span className="text-gray-600">
                        {ingredient.quantity} {ingredient.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Пищевая ценность */}
              <div>
                <h4 className="font-medium mb-2">Пищевая ценность:</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Калории:</span>
                    <span>{Math.round(meal.calories)} ккал</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Белки:</span>
                    <span>{Math.round(meal.protein)}г</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Жиры:</span>
                    <span>{Math.round(meal.fat)}г</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Углеводы:</span>
                    <span>{Math.round(meal.carbs)}г</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MealPlanPage; 