import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { GroceryItem } from "@/types";
import { showAlert } from "@/lib/telegram";

// Валидация данных
const validateGroceryItem = (item: any): boolean => {
  return (
    item &&
    typeof item.id === 'number' &&
    typeof item.quantity === 'number' &&
    item.quantity > 0 &&
    item.foodItem &&
    typeof item.foodItem.name === 'string' &&
    typeof item.foodItem.pricePerUnit === 'number' &&
    typeof item.foodItem.category === 'string'
  );
};

export function useGroceryList(userId?: number) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  // Get grocery items
  const {
    data: groceryItems = [],
    isLoading: isLoadingGroceryItems,
    error: groceryItemsError,
  } = useQuery({
    queryKey: ['/api/grocery-items/user', userId],
    enabled: !!userId,
    initialData: [],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/grocery-items/user/${userId}`);
        const data = await response.json();
        
        // Валидация полученных данных
        if (!Array.isArray(data)) {
          console.error('Invalid response format: expected array');
          throw new Error('Invalid response format');
        }

        // Проверяем каждый элемент
        const validItems = data.filter(validateGroceryItem);
        if (validItems.length !== data.length) {
          console.warn(`Filtered out ${data.length - validItems.length} invalid items`);
        }

        return validItems;
      } catch (error) {
        console.error('Error fetching grocery items:', error);
        throw error;
      }
    },
  });

  // Update grocery item
  const {
    mutate: updateGroceryItem,
    isPending: isUpdating,
  } = useMutation({
    mutationFn: async ({ id, purchased, quantity }: { id: number; purchased?: boolean; quantity?: number }) => {
      try {
        // Валидация входных данных
        if (quantity !== undefined && (typeof quantity !== 'number' || quantity <= 0)) {
          throw new Error('Invalid quantity value');
        }

        console.log(`Updating grocery item ${id}:`, { purchased, quantity });
        
        const response = await apiRequest('PATCH', `/api/grocery-items/${id}`, {
          ...(purchased !== undefined && { purchased }),
          ...(quantity !== undefined && { quantity }),
        });
        
        const data = await response.json();
        
        // Валидация ответа
        if (!validateGroceryItem(data)) {
          throw new Error('Invalid response data');
        }

        return data;
      } catch (error) {
        console.error("Error updating grocery item:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        showAlert(`Failed to update item: ${errorMessage}`);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Successfully updated grocery item:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/grocery-items/user'] });
    },
  });

  // Add grocery item
  const {
    mutate: addGroceryItem,
    isPending: isAdding,
  } = useMutation({
    mutationFn: async (item: { foodItemId: number; quantity: number }) => {
      try {
        if (!userId) {
          throw new Error("User ID is required to add a grocery item");
        }

        // Валидация входных данных
        if (typeof item.quantity !== 'number' || item.quantity <= 0) {
          throw new Error('Invalid quantity value');
        }

        console.log('Adding new grocery item:', item);

        const response = await apiRequest('POST', '/api/grocery-items', {
          userId,
          foodItemId: item.foodItemId,
          quantity: item.quantity,
          purchased: false,
        });
        
        const data = await response.json();
        
        // Валидация ответа
        if (!validateGroceryItem(data)) {
          throw new Error('Invalid response data');
        }

        return data;
      } catch (error) {
        console.error("Error adding grocery item:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        showAlert(`Failed to add item: ${errorMessage}`);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Successfully added grocery item:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/grocery-items/user'] });
      showAlert("Item added to grocery list");
    },
  });

  // Filter and search grocery items with validation
  const filteredGroceryItems = groceryItems
    ? groceryItems.filter((item: any) => {
        if (!validateGroceryItem(item)) {
          console.warn('Invalid grocery item found:', item);
          return false;
        }

        const matchesSearch = searchTerm
          ? item.foodItem.name.toLowerCase().includes(searchTerm.toLowerCase())
          : true;
        
        const matchesCategory = selectedCategory
          ? item.foodItem.category === selectedCategory
          : true;
        
        return matchesSearch && matchesCategory;
      })
    : [];

  // Group items by category with validation
  const groupedGroceryItems = filteredGroceryItems.reduce((groups: Record<string, any[]>, item: any) => {
    if (!validateGroceryItem(item)) {
      console.warn('Invalid grocery item found during grouping:', item);
      return groups;
    }

    const category = item.foodItem.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {});

  // Calculate totals with validation
  const calculateTotals = () => {
    if (!groceryItems) return { totalCount: 0, purchasedCount: 0, totalCost: 0 };
    
    return groceryItems.reduce(
      (acc: { totalCount: number; purchasedCount: number; totalCost: number }, item: any) => {
        if (!validateGroceryItem(item)) {
          console.warn('Invalid grocery item found during total calculation:', item);
          return acc;
        }

        acc.totalCount++;
        if (item.purchased) acc.purchasedCount++;
        
        const itemCost = item.foodItem.pricePerUnit * item.quantity;
        acc.totalCost += itemCost;
        
        return acc;
      },
      { totalCount: 0, purchasedCount: 0, totalCost: 0 }
    );
  };

  const totals = calculateTotals();

  // Batch update grocery items
  const {
    mutate: batchUpdateGroceryItems,
    isPending: isBatchUpdating,
  } = useMutation({
    mutationFn: async (updates: Array<{ id: number; purchased?: boolean; quantity?: number }>) => {
      try {
        console.log('Starting batch update of grocery items:', updates);

        // Валидация всех обновлений перед отправкой
        const validUpdates = updates.filter(update => {
          const isValid = (
            typeof update.id === 'number' &&
            (update.quantity === undefined || (typeof update.quantity === 'number' && update.quantity > 0))
          );
          if (!isValid) {
            console.warn('Invalid update found:', update);
          }
          return isValid;
        });

        if (validUpdates.length !== updates.length) {
          console.warn(`Filtered out ${updates.length - validUpdates.length} invalid updates`);
        }

        // Выполняем все обновления параллельно
        const updatePromises = validUpdates.map(update => 
          apiRequest('PATCH', `/api/grocery-items/${update.id}`, {
            ...(update.purchased !== undefined && { purchased: update.purchased }),
            ...(update.quantity !== undefined && { quantity: update.quantity }),
          }).then(response => response.json())
        );

        const results = await Promise.all(updatePromises);
        
        // Валидация результатов
        const validResults = results.filter(validateGroceryItem);
        if (validResults.length !== results.length) {
          console.warn(`Received ${results.length - validResults.length} invalid responses`);
        }

        return validResults;
      } catch (error) {
        console.error("Error in batch update:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        showAlert(`Failed to update items: ${errorMessage}`);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Successfully completed batch update:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/grocery-items/user'] });
    },
  });

  // Batch add grocery items
  const {
    mutate: batchAddGroceryItems,
    isPending: isBatchAdding,
  } = useMutation({
    mutationFn: async (items: Array<{ foodItemId: number; quantity: number }>) => {
      try {
        if (!userId) {
          throw new Error("User ID is required to add grocery items");
        }

        console.log('Starting batch add of grocery items:', items);

        // Валидация всех элементов перед отправкой
        const validItems = items.filter(item => {
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

        if (validItems.length !== items.length) {
          console.warn(`Filtered out ${items.length - validItems.length} invalid items`);
        }

        // Выполняем все добавления параллельно
        const addPromises = validItems.map(item =>
          apiRequest('POST', '/api/grocery-items', {
            userId,
            foodItemId: item.foodItemId,
            quantity: item.quantity,
            purchased: false,
          }).then(response => response.json())
        );

        const results = await Promise.all(addPromises);
        
        // Валидация результатов
        const validResults = results.filter(validateGroceryItem);
        if (validResults.length !== results.length) {
          console.warn(`Received ${results.length - validResults.length} invalid responses`);
        }

        return validResults;
      } catch (error) {
        console.error("Error in batch add:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        showAlert(`Failed to add items: ${errorMessage}`);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Successfully completed batch add:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/grocery-items/user'] });
      showAlert("Items added to grocery list");
    },
  });

  return {
    groceryItems: filteredGroceryItems,
    groupedGroceryItems,
    isLoadingGroceryItems,
    error: groceryItemsError,
    updateGroceryItem,
    addGroceryItem,
    batchUpdateGroceryItems,
    batchAddGroceryItems,
    isUpdating,
    isAdding,
    isBatchUpdating,
    isBatchAdding,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    showFilter,
    setShowFilter,
    totals,
  };
}
