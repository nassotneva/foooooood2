import { useLocation } from "wouter";
import { Home, ClipboardList, ShoppingCart, MapPin } from "lucide-react";

export function BottomNavigation() {
  const [location, setLocation] = useLocation();
  
  const isActive = (path: string) => location === path;
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-30">
      <div className="max-w-md mx-auto px-4 py-2 flex justify-between items-center">
        <button 
          className={`flex flex-col items-center p-2 ${isActive('/') ? 'text-primary' : 'text-neutral-600'}`}
          onClick={() => setLocation('/')}
        >
          <Home className="h-6 w-6" />
          <span className="text-xs mt-1">Главная</span>
        </button>
        
        <button 
          className={`flex flex-col items-center p-2 ${isActive('/meal-plan') ? 'text-primary' : 'text-neutral-600'}`}
          onClick={() => setLocation('/meal-plan')}
        >
          <ClipboardList className="h-6 w-6" />
          <span className="text-xs mt-1">План</span>
        </button>
        
        <button 
          className={`flex flex-col items-center p-2 ${isActive('/grocery-list') ? 'text-primary' : 'text-neutral-600'}`}
          onClick={() => setLocation('/grocery-list')}
        >
          <ShoppingCart className="h-6 w-6" />
          <span className="text-xs mt-1">Продукты</span>
        </button>
        
        <button 
          className={`flex flex-col items-center p-2 ${isActive('/stores-map') ? 'text-primary' : 'text-neutral-600'}`}
          onClick={() => setLocation('/stores-map')}
        >
          <MapPin className="h-6 w-6" />
          <span className="text-xs mt-1">Магазины</span>
        </button>
      </div>
    </nav>
  );
}
