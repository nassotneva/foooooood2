import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GeoLocation, Store } from "@/types";
import { showAlert } from "@/lib/telegram";

export function useStores() {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'rating'>('distance');

  // Request user's location
  const requestLocation = () => {
    setRequestingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setRequestingLocation(false);
      showAlert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setRequestingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setLocationError(
          error.message || "Unable to retrieve your location"
        );
        setRequestingLocation(false);
        showAlert(`Unable to retrieve your location: ${error.message}`);
      }
    );
  };

  // Get stores
  const {
    data: stores,
    isLoading: isLoadingStores,
    error: storesError,
  } = useQuery({
    queryKey: ['/api/stores/nearby', location?.latitude, location?.longitude],
    enabled: !!location,
    queryFn: async () => {
      if (!location) return [];
      
      const response = await fetch(
        `/api/stores/nearby?lat=${location.latitude}&lng=${location.longitude}&radius=5`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        throw new Error(`Error fetching stores: ${response.statusText}`);
      }
      
      return await response.json();
    },
  });

  // Sort stores based on the selected sort option
  const sortedStores = stores
    ? [...stores].sort((a: Store, b: Store) => {
        switch (sortBy) {
          case 'price':
            return a.price - b.price;
          case 'rating':
            return b.rating - a.rating;
          case 'distance':
          default:
            return a.distance - b.distance;
        }
      })
    : [];

  return {
    stores: sortedStores,
    isLoadingStores,
    error: storesError || locationError,
    location,
    requestLocation,
    requestingLocation,
    sortBy,
    setSortBy,
  };
}
