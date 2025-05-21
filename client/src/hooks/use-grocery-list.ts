import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { GroceryItem } from "@/types";
import { showAlert } from "@/lib/telegram";

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
  });

  // Update grocery item (mark as purchased/unpurchased)
  const {
    mutate: updateGroceryItem,
    isPending: isUpdating,
  } = useMutation({
    mutationFn: async ({ id, purchased, quantity }: { id: number; purchased?: boolean; quantity?: number }) => {
      try {
        const response = await apiRequest('PATCH', `/api/grocery-items/${id}`, {
          ...(purchased !== undefined && { purchased }),
          ...(quantity !== undefined && { quantity }),
        });
        
        return response.json();
      } catch (error) {
        console.error("Error updating grocery item:", error);
        if (error instanceof Error) {
          showAlert(`Failed to update item: ${error.message}`);
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate grocery items query
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

        const response = await apiRequest('POST', '/api/grocery-items', {
          userId,
          foodItemId: item.foodItemId,
          quantity: item.quantity,
          purchased: false,
        });
        
        return response.json();
      } catch (error) {
        console.error("Error adding grocery item:", error);
        if (error instanceof Error) {
          showAlert(`Failed to add item: ${error.message}`);
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate grocery items query
      queryClient.invalidateQueries({ queryKey: ['/api/grocery-items/user'] });
      showAlert("Item added to grocery list");
    },
  });

  // Filter and search grocery items
  const filteredGroceryItems = groceryItems
    ? groceryItems.filter((item: any) => {
        const matchesSearch = searchTerm
          ? item.foodItem.name.toLowerCase().includes(searchTerm.toLowerCase())
          : true;
        
        const matchesCategory = selectedCategory
          ? item.foodItem.category === selectedCategory
          : true;
        
        return matchesSearch && matchesCategory;
      })
    : [];

  // Group items by category
  const groupedGroceryItems = filteredGroceryItems.reduce((groups: Record<string, any[]>, item: any) => {
    const category = item.foodItem.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {});

  // Calculate totals
  const calculateTotals = () => {
    if (!groceryItems) return { totalCount: 0, purchasedCount: 0, totalCost: 0 };
    
    return groceryItems.reduce(
      (acc: { totalCount: number; purchasedCount: number; totalCost: number }, item: any) => {
        acc.totalCount++;
        if (item.purchased) acc.purchasedCount++;
        
        // Calculate cost based on price per unit and quantity
        const itemCost = item.foodItem.pricePerUnit * item.quantity;
        acc.totalCost += itemCost;
        
        return acc;
      },
      { totalCount: 0, purchasedCount: 0, totalCost: 0 }
    );
  };

  const totals = calculateTotals();

  return {
    groceryItems: filteredGroceryItems,
    groupedGroceryItems,
    isLoadingGroceryItems,
    error: groceryItemsError,
    updateGroceryItem,
    addGroceryItem,
    isUpdating,
    isAdding,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    showFilter,
    setShowFilter,
    totals,
  };
}
