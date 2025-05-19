import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRecipes } from "@/hooks/use-recipes";
import { RecipeCard } from "@/components/RecipeCard";
import { SpoonacularRecipe } from "@shared/types/spoonacular";

export default function RecipesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [ingredients, setIngredients] = useState("");
  const { searchResults, isSearching, searchError, ingredientsResults, isLoadingIngredients, ingredientsError } = useRecipes();

  const handleSearch = async () => {
    if (searchQuery) {
      // Поиск по названию
      const response = await fetch(`/api/recipes/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      // Обработка результатов
    } else if (ingredients) {
      // Поиск по ингредиентам
      const response = await fetch(`/api/recipes/by-ingredients?ingredients=${encodeURIComponent(ingredients)}`);
      const data = await response.json();
      // Обработка результатов
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Поиск рецептов</h1>
      
      <div className="space-y-4 mb-8">
        <div>
          <Input
            type="text"
            placeholder="Поиск по названию блюда..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-2"
          />
          <Button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery}
            className="w-full"
          >
            {isSearching ? "Поиск..." : "Найти рецепты"}
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              или
            </span>
          </div>
        </div>

        <div>
          <Input
            type="text"
            placeholder="Поиск по ингредиентам (через запятую)..."
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            className="mb-2"
          />
          <Button
            onClick={handleSearch}
            disabled={isLoadingIngredients || !ingredients}
            className="w-full"
          >
            {isLoadingIngredients ? "Поиск..." : "Найти по ингредиентам"}
          </Button>
        </div>
      </div>

      {(searchError || ingredientsError) && (
        <div className="text-red-500 mb-4">
          {searchError?.message || ingredientsError?.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {searchResults?.results?.map((recipe: SpoonacularRecipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onImport={() => {
              // Обновить список после импорта
            }}
          />
        ))}
        {ingredientsResults?.map((recipe: SpoonacularRecipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onImport={() => {
              // Обновить список после импорта
            }}
          />
        ))}
      </div>
    </div>
  );
} 