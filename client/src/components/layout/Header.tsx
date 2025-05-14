import { Tab } from "@/types";
import { Link, useLocation } from "wouter";

interface HeaderProps {
  activeTab: string;
}

export function Header({ activeTab }: HeaderProps) {
  const [location, setLocation] = useLocation();
  
  const tabs: Tab[] = [
    { id: "home", label: "Главная", path: "/" },
    { id: "meal-plan", label: "План питания", path: "/meal-plan" },
    { id: "grocery-list", label: "Список продуктов", path: "/grocery-list" },
    { id: "stores-map", label: "Карта магазинов", path: "/stores-map" }
  ];
  
  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm">
      <div className="px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <svg 
            className="w-8 h-8 mr-2 text-primary"
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M21 13V15C21 17.8284 21 19.2426 20.1213 20.1213C19.2426 21 17.8284 21 15 21H9C6.17157 21 4.75736 21 3.87868 20.1213C3 19.2426 3 17.8284 3 15V13M16 8L12 12M12 12L8 8M12 12V3" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          <h1 className="text-xl font-bold text-neutral-900">MealBuddy</h1>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <nav className="flex border-b border-neutral-300">
        {tabs.map((tab) => (
          <button 
            key={tab.id}
            className={`flex-1 px-4 py-2 text-center text-sm font-medium border-b-2 
              ${activeTab === tab.id 
                ? 'border-primary text-primary' 
                : 'border-transparent text-neutral-600 hover:text-neutral-900'}`}
            onClick={() => setLocation(tab.path)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
