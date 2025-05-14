import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { useGroceryList } from "@/hooks/use-grocery-list";
import { useProfile } from "@/hooks/use-profile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GroceryItem } from "@/components/grocery/GroceryItem";
import { CategoryFilter } from "@/components/grocery/CategoryFilter";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Filter } from "lucide-react";
import { useLocation } from "wouter";

export default function GroceryList() {
  const [, setLocation] = useLocation();
  const { profile } = useProfile();
  const {
    groceryItems,
    groupedGroceryItems,
    isLoadingGroceryItems,
    updateGroceryItem,
    isUpdating,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    showFilter,
    setShowFilter,
    totals,
  } = useGroceryList(profile?.id);

  // Extract all categories for the filter
  const categories = groceryItems 
    ? [...new Set(groceryItems.map((item: any) => item.foodItem.category))]
    : [];

  const handleUpdatePurchased = (id: number, purchased: boolean) => {
    updateGroceryItem({ id, purchased });
  };

  const handleUpdateQuantity = (id: number, quantity: number) => {
    // This would ideally update quantity, but we'll just toggle purchased for now
    // since the storage.ts doesn't have this functionality directly
    const item = groceryItems.find((item: any) => item.id === id);
    if (item) {
      // For now we'll just toggle purchased status to show some interactivity
      updateGroceryItem({ id, purchased: !item.purchased });
    }
  };

  const handleShowStoresMap = () => {
    setLocation('/stores-map');
  };

  if (isLoadingGroceryItems) {
    return (
      <div className="container-app">
        <Header activeTab="grocery-list" />
        
        <main className="p-4">
          <div className="mb-4">
            <Skeleton className="h-8 w-40 mb-3" />
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-32 w-full mb-4" />
          </div>
          
          <div className="space-y-1">
            <Skeleton className="h-8 w-full mb-1" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-8 w-full mb-1 mt-3" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </main>
        
        <BottomNavigation />
      </div>
    );
  }

  // If no grocery items, show empty state
  if (groceryItems && groceryItems.length === 0) {
    return (
      <div className="container-app">
        <Header activeTab="grocery-list" />
        
        <main className="p-4">
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">Список продуктов</h2>
          
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
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-neutral-700 mb-2">Список продуктов пуст</h3>
            <p className="text-sm text-neutral-500 text-center mb-4">
              Добавьте продукты из плана питания, чтобы они появились здесь
            </p>
            <Button
              onClick={() => setLocation('/meal-plan')}
              className="px-4 py-2 bg-primary text-white rounded-md"
            >
              Перейти к плану питания
            </Button>
          </div>
        </main>
        
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="container-app">
      <Header activeTab="grocery-list" />
      
      <main className="p-4">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">Список продуктов</h2>
          
          {/* Search and Filter */}
          <div className="flex items-center mb-4 gap-2">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Поиск продуктов..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-neutral-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            <Button
              variant="outline" 
              size="icon"
              onClick={() => setShowFilter(!showFilter)}
              className="p-2 rounded-md border border-neutral-300 bg-white flex items-center justify-center"
            >
              <Filter className="h-5 w-5 text-neutral-600" />
            </Button>
          </div>
          
          {/* Filter categories (toggleable) */}
          <div className={`mb-3 ${showFilter ? 'block' : 'hidden'}`}>
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>
          
          {/* Summary Card */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-300 p-3 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-neutral-600">Всего продуктов:</div>
                <div className="text-lg font-semibold text-neutral-900">{totals.totalCount} наименований</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-neutral-600">Общая стоимость:</div>
                <div className="text-lg font-semibold text-primary">{totals.totalCost.toFixed(0)}₽</div>
              </div>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <div>
                <span className="text-neutral-600">В наличии:</span>
                <span className="font-medium text-neutral-900 ml-1">{totals.purchasedCount}</span>
              </div>
              <div>
                <span className="text-neutral-600">Нужно купить:</span>
                <span className="font-medium text-primary ml-1">{totals.totalCount - totals.purchasedCount}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Grocery Items List */}
        <div className="space-y-1">
          {Object.entries(groupedGroceryItems).map(([category, items]) => (
            <div key={category}>
              {/* Category Header */}
              <div className="text-sm font-medium bg-neutral-100 px-3 py-2 rounded-md mb-1">
                {categoryToRussian(category)}
              </div>
              
              {/* Items */}
              {items.map((item: any) => (
                <GroceryItem
                  key={item.id}
                  id={item.id}
                  name={item.foodItem.name}
                  quantity={item.quantity}
                  unit={item.foodItem.unit}
                  price={item.foodItem.pricePerUnit * item.quantity}
                  category={item.foodItem.category}
                  purchased={item.purchased}
                  onUpdatePurchased={handleUpdatePurchased}
                  onUpdateQuantity={handleUpdateQuantity}
                />
              ))}
            </div>
          ))}
          
          {/* Find Stores Button */}
          <div className="mt-6">
            <Button
              onClick={handleShowStoresMap}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <MapPin className="h-5 w-5 mr-2" />
              Найти ближайшие магазины
            </Button>
          </div>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
}

function categoryToRussian(category: string): string {
  const categories: Record<string, string> = {
    vegetables: "Овощи",
    fruits: "Фрукты",
    dairy: "Молочные продукты",
    meat: "Мясо",
    fish: "Рыба",
    grains: "Крупы",
    other: "Другое",
  };

  return categories[category] || category;
}
