import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Profile } from "@/types";
import { profileSchema } from "@shared/schema";
import { getUserInfo } from "@/lib/telegram";
import { showAlert } from "@/lib/telegram";

export function useProfile() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const telegramUser = getUserInfo();
  
  // Get user profile from API
  const {
    data: profile,
    isLoading: isLoadingProfile,
    error: profileError
  } = useQuery({
    queryKey: ['/api/users/telegram', telegramUser?.id],
    enabled: !!telegramUser?.id, // Only run query if we have a Telegram user ID
    queryFn: async () => {
      try {
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
            password: `telegram_${telegramUser.id}`, // Placeholder password
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
      // Clear any errors
      setError(null);
      
      // Invalidate relevant queries
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
    isLoadingProfile,
    saveProfile,
    isSaving,
    error,
    telegramUser
  };
}
