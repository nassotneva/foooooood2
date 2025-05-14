import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { initTelegramWebApp } from "./lib/telegram";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import MealPlan from "@/pages/MealPlan";
import GroceryList from "@/pages/GroceryList";
import StoresMap from "@/pages/StoresMap";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/meal-plan" component={MealPlan} />
      <Route path="/grocery-list" component={GroceryList} />
      <Route path="/stores-map" component={StoresMap} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize Telegram WebApp
  useEffect(() => {
    initTelegramWebApp();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
