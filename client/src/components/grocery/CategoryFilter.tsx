import { Button } from "@/components/ui/button";

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selectedCategory === null ? "default" : "outline"}
        size="sm"
        className={`px-3 py-1 text-xs font-medium rounded-full ${
          selectedCategory === null
            ? "bg-primary text-white"
            : "bg-white text-neutral-700 border border-neutral-300"
        }`}
        onClick={() => onSelectCategory(null)}
      >
        Все
      </Button>
      
      {categories.map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? "default" : "outline"}
          size="sm"
          className={`px-3 py-1 text-xs font-medium rounded-full ${
            selectedCategory === category
              ? "bg-primary text-white"
              : "bg-white text-neutral-700 border border-neutral-300"
          }`}
          onClick={() => onSelectCategory(category)}
        >
          {categoryToRussian(category)}
        </Button>
      ))}
    </div>
  );
}

function categoryToRussian(category: string): string {
  const categories: Record<string, string> = {
    vegetables: "Овощи",
    fruits: "Фрукты",
    dairy: "Молочные",
    meat: "Мясо",
    fish: "Рыба",
    grains: "Крупы",
    other: "Другое",
  };

  return categories[category] || category;
}
