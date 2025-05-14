import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/Header";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { NutritionSummary } from "@/components/profile/NutritionSummary";
import { useProfile } from "@/hooks/use-profile";
import { useMealPlan } from "@/hooks/use-meal-plan";
import { Profile } from "@/types";
import { calculateBMR, calculateTDEE, calculateCaloriesForGoal, calculateMacros } from "@/lib/nutrition";
import { expandApp } from "@/lib/telegram";

export default function Home() {
  const [, setLocation] = useLocation();
  const { profile, saveProfile, isLoadingProfile, isSaving, telegramUser } = useProfile();
  const [showSummary, setShowSummary] = useState(false);
  const { generateMealPlan, isGenerating } = useMealPlan(profile?.id);
  const [calculatedNutrition, setCalculatedNutrition] = useState<any>(null);
  
  // Expand app when component mounts
  useEffect(() => {
    expandApp();
  }, []);
  
  // Show nutrition summary if the profile already exists
  useEffect(() => {
    if (profile && !isLoadingProfile) {
      const profileData: Profile = {
        age: profile.age || 30,
        gender: (profile.gender as any) || 'male',
        weight: profile.weight || 70,
        height: profile.height || 175,
        activity: (profile.activity as any) || 'moderate',
        goal: (profile.goal as any) || 'maintain',
        budget: profile.budget || 500
      };
      
      // Calculate nutrition data
      const bmr = calculateBMR(profileData);
      const tdee = calculateTDEE(bmr, profileData.activity);
      const calories = calculateCaloriesForGoal(tdee, profileData.goal);
      const nutrition = calculateMacros(calories, profileData);
      
      setCalculatedNutrition(nutrition);
      setShowSummary(true);
    }
  }, [profile, isLoadingProfile]);
  
  const handleSubmit = async (data: Profile) => {
    try {
      // Save profile to database
      await saveProfile(data);
      
      // Calculate nutrition data
      const bmr = calculateBMR(data);
      const tdee = calculateTDEE(bmr, data.activity);
      const calories = calculateCaloriesForGoal(tdee, data.goal);
      const nutrition = calculateMacros(calories, data);
      
      setCalculatedNutrition(nutrition);
      setShowSummary(true);
      
      // Generate meal plan based on profile
      if (profile?.id) {
        generateMealPlan(data);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };
  
  const handleViewMealPlan = () => {
    setLocation('/meal-plan');
  };
  
  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-20 relative shadow-md">
      <Header activeTab="home" />
      
      <main className="p-4">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">
            {profile ? 'Ваш профиль' : 'Создайте свой профиль'}
          </h2>
          <p className="text-neutral-600 mb-4">
            {profile 
              ? 'Отредактируйте свои данные для обновления плана питания'
              : 'Введите свои данные для персонализированного плана питания'
            }
          </p>
          
          <ProfileForm 
            onSubmit={handleSubmit} 
            initialData={profile || undefined}
            isSubmitting={isSaving || isGenerating}
          />
        </div>
        
        {showSummary && calculatedNutrition && (
          <div className="mt-8" id="profile-summary">
            <h3 className="text-lg font-medium text-neutral-900 mb-3">Ваш план питания</h3>
            <NutritionSummary 
              nutrition={calculatedNutrition}
              onViewMealPlan={handleViewMealPlan}
            />
          </div>
        )}
        
        <div className="mt-8">
          <h3 className="text-lg font-medium text-neutral-900 mb-3">Здоровое питание</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg shadow-sm w-full h-36 bg-primary/10 flex items-center justify-center text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            
            <div className="rounded-lg shadow-sm w-full h-36 bg-secondary/10 flex items-center justify-center text-secondary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12"
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
            </div>
          </div>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
}
