import { useEffect, useRef } from 'react';
import { GeoLocation, Store } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { hapticFeedback } from '@/lib/telegram';

interface MapProps {
  location: GeoLocation | null;
  stores: Store[];
  isLoading: boolean;
  onEnableLocation: () => void;
}

export function Map({ location, stores, isLoading, onEnableLocation }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markers = useRef<any[]>([]);
  
  useEffect(() => {
    // Skip if location is not available or map is already initialized
    if (!location || !mapRef.current || leafletMap.current) return;
    
    // Dynamically import Leaflet
    const loadLeaflet = async () => {
      try {
        const L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');
        
        // Initialize map
        leafletMap.current = L.map(mapRef.current).setView(
          [location.latitude, location.longitude],
          15
        );
        
        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(leafletMap.current);
        
        // Add marker for user location
        const userIcon = L.divIcon({
          html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>`,
          className: '',
          iconSize: [16, 16]
        });
        
        L.marker([location.latitude, location.longitude], { icon: userIcon })
          .addTo(leafletMap.current)
          .bindPopup('Ваше местоположение')
          .openPopup();
        
        // Add markers for stores
        const storeIcon = L.divIcon({
          html: `<div class="w-6 h-6 bg-primary rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">М</div>`,
          className: '',
          iconSize: [24, 24]
        });
        
        stores.forEach(store => {
          const marker = L.marker([store.latitude, store.longitude], { icon: storeIcon })
            .addTo(leafletMap.current)
            .bindPopup(`<b>${store.name}</b><br>${store.address}`);
          
          markers.current.push(marker);
        });
        
        // Provide haptic feedback
        hapticFeedback.notification('success');
      } catch (error) {
        console.error('Error loading map:', error);
      }
    };
    
    loadLeaflet();
    
    // Cleanup
    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
        markers.current = [];
      }
    };
  }, [location, stores]);
  
  // Update markers when stores change
  useEffect(() => {
    if (!leafletMap.current || !location) return;
    
    // Clean up existing markers
    markers.current.forEach(marker => {
      if (leafletMap.current) {
        leafletMap.current.removeLayer(marker);
      }
    });
    markers.current = [];
    
    // Add new markers
    try {
      const L = require('leaflet');
      const storeIcon = L.divIcon({
        html: `<div class="w-6 h-6 bg-primary rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">М</div>`,
        className: '',
        iconSize: [24, 24]
      });
      
      stores.forEach(store => {
        const marker = L.marker([store.latitude, store.longitude], { icon: storeIcon })
          .addTo(leafletMap.current)
          .bindPopup(`<b>${store.name}</b><br>${store.address}`);
        
        markers.current.push(marker);
      });
    } catch (error) {
      console.error('Error updating markers:', error);
    }
  }, [stores, location]);
  
  if (!location) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-300 p-4 mb-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-neutral-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm text-neutral-800">
              Для поиска ближайших магазинов требуется доступ к геолокации.
            </p>
          </div>
        </div>
        <button 
          type="button" 
          className="mt-3 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          onClick={onEnableLocation}
        >
          Разрешить доступ к местоположению
        </button>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-300 overflow-hidden mb-4">
      {isLoading ? (
        <Skeleton className="w-full h-60" />
      ) : (
        <div ref={mapRef} className="w-full h-60 bg-neutral-100"></div>
      )}
    </div>
  );
}
