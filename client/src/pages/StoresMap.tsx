import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { useStores } from "@/hooks/use-stores";
import { Map } from "@/components/stores/Map";
import { StoreItem } from "@/components/stores/StoreItem";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Store } from "@/types";
import { showAlert, expandApp, sendDataToTelegram, showMainButton, hapticFeedback } from "@/lib/telegram";

export default function StoresMap() {
  const {
    stores,
    isLoadingStores,
    error,
    location,
    requestLocation,
    requestingLocation,
    sortBy,
    setSortBy,
  } = useStores();

  // Expand app when component mounts
  useEffect(() => {
    expandApp();
    
    // Если у нас есть магазины и местоположение, показываем кнопку для отправки данных в Telegram
    if (stores && stores.length > 0 && location) {
      showMainButton('Отправить список магазинов в Telegram', () => {
        // Отправляем данные в Telegram
        if (sendDataToTelegram(stores, 'stores')) {
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
  }, [stores, location]);

  const handleSelectStore = (store: Store) => {
    showAlert(`Выбран магазин: ${store.name}`);
    
    // Дополнительно можно отправить данные о конкретном магазине в Telegram
    sendDataToTelegram(store, 'stores');
    hapticFeedback.impact('medium');
  };

  const handleFilterStores = (value: string) => {
    setSortBy(value as 'distance' | 'price' | 'rating');
  };

  // Mock stores for UI display when real ones aren't loaded yet
  const mockStores = [
    {
      id: 1,
      name: "Магнит",
      address: "ул. Ленина, 15",
      distance: 0.7,
      duration: 10,
      rating: 4.0,
      reviewCount: 120,
      price: 950,
      imageUrl: "https://images.unsplash.com/photo-1536819114556-1c7753bfb294?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80",
      latitude: 55.751244,
      longitude: 37.618423,
    },
    {
      id: 2,
      name: "Пятерочка",
      address: "ул. Пушкина, 10",
      distance: 1.2,
      duration: 15,
      rating: 4.2,
      reviewCount: 95,
      price: 920,
      imageUrl: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80",
      latitude: 55.755814,
      longitude: 37.617635,
    },
    {
      id: 3,
      name: "ВкусВилл",
      address: "пр. Мира, 22",
      distance: 1.5,
      duration: 20,
      rating: 4.8,
      reviewCount: 210,
      price: 1100,
      imageUrl: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80",
      latitude: 55.758814,
      longitude: 37.637635,
    },
  ];

  // Use actual stores if available, otherwise use mock stores for UI display
  const displayStores = stores && stores.length > 0 ? stores : mockStores;

  return (
    <div className="container-app">
      <Header activeTab="stores-map" />
      
      <main className="p-4">
        <h2 className="text-xl font-semibold text-neutral-900 mb-3">Карта магазинов</h2>
        
        {/* Map Container */}
        <Map
          location={location}
          stores={displayStores}
          isLoading={isLoadingStores || requestingLocation}
          onEnableLocation={requestLocation}
        />
        
        {location && (
          <div className="px-4 py-3 bg-white rounded-lg shadow-sm border border-neutral-300 overflow-hidden mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-neutral-900">Ближайшие магазины</h3>
              <div>
                <Select
                  value={sortBy}
                  onValueChange={handleFilterStores}
                >
                  <SelectTrigger className="text-sm border-neutral-300 rounded-md shadow-sm focus:ring-primary focus:border-primary h-8 px-2 py-0 min-w-[130px]">
                    <SelectValue placeholder="Сортировка" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="distance">По расстоянию</SelectItem>
                    <SelectItem value="price">По ценам</SelectItem>
                    <SelectItem value="rating">По рейтингу</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Store List */}
            <div className="space-y-3">
              {isLoadingStores ? (
                <>
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </>
              ) : (
                displayStores.map((store) => (
                  <StoreItem 
                    key={store.id} 
                    store={store} 
                    onSelect={handleSelectStore} 
                  />
                ))
              )}
            </div>
          </div>
        )}
      </main>
      
      <BottomNavigation />
    </div>
  );
}
