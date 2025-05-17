import { TelegramWebApp } from "../types";

declare global {
  interface Window {
    Telegram: {
      WebApp: TelegramWebApp;
    };
  }
}

export const webApp = window.Telegram?.WebApp;

export const initTelegramWebApp = () => {
  console.log("Initializing Telegram WebApp...");
  console.log("Window.Telegram:", window.Telegram);
  console.log("WebApp:", window.Telegram?.WebApp);
  
  if (!webApp) {
    console.warn("Telegram WebApp is not available");
    return null;
  }

  // Notify the Telegram app that the WebApp is ready
  webApp.ready();
  console.log("WebApp initialized:", webApp);
  console.log("User data:", webApp.initDataUnsafe.user);

  return webApp;
};

export const getUserInfo = () => {
  if (!webApp) {
    return null;
  }

  return webApp.initDataUnsafe.user;
};

export const showMainButton = (text: string, onClick: () => void) => {
  if (!webApp?.MainButton) {
    return;
  }

  webApp.MainButton.setText(text);
  webApp.MainButton.onClick(onClick);
  webApp.MainButton.show();
};

export const hideMainButton = () => {
  if (!webApp?.MainButton) {
    return;
  }

  webApp.MainButton.hide();
};

export const showBackButton = (onClick: () => void) => {
  if (!webApp?.BackButton) {
    return;
  }

  webApp.BackButton.onClick(onClick);
  webApp.BackButton.show();
};

export const hideBackButton = () => {
  if (!webApp?.BackButton) {
    return;
  }

  webApp.BackButton.hide();
};

export const showAlert = (message: string) => {
  if (!webApp) {
    alert(message);
    return;
  }

  webApp.showAlert(message);
};

export const showConfirm = async (message: string) => {
  if (!webApp) {
    return window.confirm(message);
  }

  return await webApp.showConfirm(message);
};

export const hapticFeedback = {
  impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
    webApp?.HapticFeedback?.impactOccurred(style);
  },
  notification: (type: 'error' | 'success' | 'warning' = 'success') => {
    webApp?.HapticFeedback?.notificationOccurred(type);
  },
  selectionChanged: () => {
    webApp?.HapticFeedback?.selectionChanged();
  },
};

export const expandApp = () => {
  webApp?.expand();
};

export const sendDataToTelegram = (data: Record<string, any>, type: 'profile' | 'mealPlan' | 'groceries') => {
  if (!webApp) {
    console.warn("Telegram WebApp is not available, cannot send data");
    return false;
  }

  try {
    // Формируем объект данных с указанием типа
    const dataToSend = JSON.stringify({
      type,
      data
    });
    
    // Отправляем данные обратно в Telegram
    webApp.sendData(dataToSend);
    
    // Возвращаем успех
    return true;
  } catch (error) {
    console.error("Error sending data to Telegram:", error);
    return false;
  }
};
