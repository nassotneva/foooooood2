import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Store } from "@/types";

interface StoreItemProps {
  store: Store;
  onSelect: (store: Store) => void;
}

export function StoreItem({ store, onSelect }: StoreItemProps) {
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="h-3.5 w-3.5 text-yellow-400" fill="currentColor" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <Star className="h-3.5 w-3.5 text-yellow-400" fill="currentColor" style={{ clipPath: 'inset(0 50% 0 0)' }} />
            <Star className="h-3.5 w-3.5 text-neutral-300 absolute top-0 left-0" fill="currentColor" style={{ clipPath: 'inset(0 0 0 50%)' }} />
          </div>
        );
      } else {
        stars.push(
          <Star key={i} className="h-3.5 w-3.5 text-neutral-300" fill="currentColor" />
        );
      }
    }
    
    return <div className="flex">{stars}</div>;
  };
  
  return (
    <div className="flex items-start justify-between border-b border-neutral-200 pb-3">
      <div className="flex items-start">
        <div className="w-12 h-12 rounded-md bg-neutral-200 overflow-hidden flex-shrink-0">
          {store.imageUrl ? (
            <img 
              src={store.imageUrl} 
              alt={store.name} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" 
                />
              </svg>
            </div>
          )}
        </div>
        <div className="ml-3">
          <h4 className="font-medium text-neutral-900">{store.name}</h4>
          <div className="flex items-center text-xs text-neutral-600 mt-0.5">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-3.5 w-3.5 mr-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
              />
            </svg>
            {store.distance.toFixed(1)} км • {store.duration} мин пешком
          </div>
          <div className="flex items-center text-xs mt-0.5">
            {renderStars(store.rating)}
            <span className="ml-1 text-neutral-600">{store.rating.toFixed(1)} ({store.reviewCount})</span>
          </div>
        </div>
      </div>
      <div>
        <div className="text-sm font-medium text-primary mb-1">{store.price}₽</div>
        <Button 
          variant="outline" 
          size="sm"
          className="px-2 py-1 text-xs rounded border border-primary text-primary hover:bg-primary hover:text-white"
          onClick={() => onSelect(store)}
        >
          Выбрать
        </Button>
      </div>
    </div>
  );
}
