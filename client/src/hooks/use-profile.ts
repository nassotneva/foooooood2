import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Profile } from "@/types";
import { profileSchema } from "@shared/schema";
import { initTelegramWebApp, getUserInfo } from "@/lib/telegram";
import { showAlert } from "@/lib/telegram";

function useTelegramUser() {
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    console.log("[Telegram Debug] window.Telegram:", window.Telegram);
    console.log("[Telegram Debug] window.Telegram?.WebApp:", window.Telegram?.WebApp);
    const webApp = initTelegramWebApp();
    console.log("[Telegram Debug] webApp after init:", webApp);
    if (webApp && webApp.initDataUnsafe && webApp.initDataUnsafe.user) {
      setTelegramUser(webApp.initDataUnsafe.user);
      console.log("[Telegram Debug] telegramUser получен:", webApp.initDataUnsafe.user);
    } else {
      setTelegramUser(null);
      console.log("[Telegram Debug] telegramUser НЕ получен");
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    console.log("[Telegram Debug] telegramUser state:", telegramUser);
    console.log("[Telegram Debug] isReady state:", isReady);
  }, [telegramUser, isReady]);

  return { telegramUser, isReady };
}

export function useProfile() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { telegramUser, isReady } = useTelegramUser();
  
  // Get user profile from API
  const {
    data: profile,
    isLoading: isLoadingProfile,
    error: profileError
  } = useQuery({
    queryKey: ['/api/users/telegram', telegramUser?.id],
    enabled: !!telegramUser?.id && isReady, // Only run query if we have a Telegram user ID and инициализация завершена
    queryFn: async () => {
      try {
        console.log("[Telegram Debug] useQuery: telegramUser:", telegramUser);
        if (!telegramUser?.id) {
          throw new Error("No Telegram user ID available");
        }
        const response = await fetch(`/api/users/telegram/${telegramUser.id}`, {
          credentials: 'include'
        });
        if (!response.ok) {
          // If user doesn't exist yet, return null
          if (response.status === 404) {
            return null;
          }
          throw new Error(`Error fetching profile: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError(error instanceof Error ? error.message : String(error));
        return null;
      }
    }
  });

  // Create or update user profile
  const { 
    mutate: saveProfile, 
    isPending: isSaving 
  } = useMutation({
    mutationFn: async (profileData: Profile) => {
      try {
        // Validate profile data
        const validatedData = profileSchema.parse(profileData);
        if (profile) {
          // Update existing profile
          const response = await apiRequest('PATCH', `/api/users/${profile.id}`, {
            ...validatedData
          });
          return response.json();
        } else {
          // Create new profile
          if (!telegramUser?.id) {
            throw new Error("No Telegram user ID available");
          }
          // Create a new user with the profile data and telegram ID
          const response = await apiRequest('POST', '/api/users', {
            username: telegramUser.username || `user_${telegramUser.id}`,
            password: `telegram_${telegramUser.id}`,
            telegramId: telegramUser.id.toString(),
            ...validatedData
          });
          return response.json();
        }
      } catch (error) {
        console.error("Error saving profile:", error);
        if (error instanceof Error) {
          setError(error.message);
          showAlert(error.message);
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['/api/users/telegram'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      return data;
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      if (error instanceof Error) {
        setError(error.message);
        showAlert(`Failed to save profile: ${error.message}`);
      }
    }
  });

  return {
    profile,
    isLoadingProfile: isLoadingProfile || !isReady,
    saveProfile,
    isSaving,
    error,
    telegramUser
  };
}
