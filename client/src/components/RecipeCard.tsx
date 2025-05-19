import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SpoonacularRecipe } from "@shared/types/spoonacular";
import { useRecipes } from "@/hooks/use-recipes";

interface RecipeCardProps {
  recipe: SpoonacularRecipe;
  onImport?: () => void;
}

export function RecipeCard({ recipe, onImport }: RecipeCardProps) {
  const { importRecipe, isImporting } = useRecipes();

  const handleImport = async () => {
    await importRecipe(recipe.id);
    onImport?.();
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <CardTitle className="mt-4">{recipe.title}</CardTitle>
        <CardDescription>
          {recipe.readyInMinutes} мин • {recipe.servings} порций
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Калории:</span>
            <span>{recipe.nutrition?.nutrients.find(n => n.name === 'Calories')?.amount || 0} ккал</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Белки:</span>
            <span>{recipe.nutrition?.nutrients.find(n => n.name === 'Protein')?.amount || 0}г</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Жиры:</span>
            <span>{recipe.nutrition?.nutrients.find(n => n.name === 'Fat')?.amount || 0}г</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Углеводы:</span>
            <span>{recipe.nutrition?.nutrients.find(n => n.name === 'Carbohydrates')?.amount || 0}г</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleImport}
          disabled={isImporting}
          className="w-full"
        >
          {isImporting ? 'Импорт...' : 'Добавить в мои блюда'}
        </Button>
      </CardFooter>
    </Card>
  );
} 