import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { showAlert } from '@/lib/utils';

export function useRecipes() {
  const queryClient = useQueryClient();

  // Поиск рецептов
  const {
    data: searchResults,
    isLoading: isSearching,
    error: searchError
  } = useQuery({
    queryKey: ['/api/recipes/search'],
    queryFn: async ({ queryKey, signal }) => {
      const response = await apiRequest('GET', queryKey[0], undefined, signal);
      return response.json();
    },
    enabled: false
  });

  // Получение рецепта по ID
  const {
    data: recipe,
    isLoading: isLoadingRecipe,
    error: recipeError
  } = useQuery({
    queryKey: ['/api/recipes'],
    queryFn: async ({ queryKey, signal }) => {
      const response = await apiRequest('GET', queryKey[0], undefined, signal);
      return response.json();
    },
    enabled: false
  });

  // Поиск рецептов по ингредиентам
  const {
    data: ingredientsResults,
    isLoading: isLoadingIngredients,
    error: ingredientsError
  } = useQuery({
    queryKey: ['/api/recipes/by-ingredients'],
    queryFn: async ({ queryKey, signal }) => {
      const response = await apiRequest('GET', queryKey[0], undefined, signal);
      return response.json();
    },
    enabled: false
  });

  // Импорт рецепта
  const {
    mutate: importRecipe,
    isPending: isImporting
  } = useMutation({
    mutationFn: async (recipeId: number) => {
      const response = await apiRequest('POST', '/api/recipes/import', {
        id: recipeId
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/food-items'] });
      showAlert('Рецепт успешно импортирован');
    }
  });

  return {
    searchResults,
    isSearching,
    searchError,
    recipe,
    isLoadingRecipe,
    recipeError,
    ingredientsResults,
    isLoadingIngredients,
    ingredientsError,
    importRecipe,
    isImporting
  };
} 