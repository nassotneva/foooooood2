// ESM версия бота для запуска через Node.js
import TelegramBot from 'node-telegram-bot-api';

// Используйте переменную окружения для хранения токена бота
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
if (!TOKEN) {
  console.error('Ошибка: Не задан токен бота. Пожалуйста, укажите TELEGRAM_BOT_TOKEN в переменных окружения.');
  process.exit(1);
}

// Создаем экземпляр бота
const bot = new TelegramBot(TOKEN, { polling: true });

// URL вашего приложения
// Автоматически получаем URL из переменных окружения Replit
const webAppUrl = process.env.WEB_APP_URL || 'https://your-app-url.replit.app';
console.log(`Используется URL для веб-приложения: ${webAppUrl}`);

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name;
  
  bot.sendMessage(chatId, `Привет, ${firstName}! Я помогу тебе спланировать питание в рамках бюджета.`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Открыть планировщик питания', web_app: { url: webAppUrl } }]
      ]
    }
  });
});

// Обработка команды /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, `
Бот для планирования питания поможет вам:

1. Создать персональный план питания на основе ваших данных
2. Отслеживать необходимые продукты
3. Найти ближайшие магазины для покупки
4. Контролировать расходы на питание

Для начала работы нажмите кнопку "Открыть планировщик питания" в меню.
  `);
});

// Обработка callback запросов от веб-приложения
bot.on('web_app_data', (msg) => {
  const chatId = msg.chat.id;
  const data = msg.web_app_data.data;
  
  try {
    const parsedData = JSON.parse(data);
    console.log('Получены данные из веб-приложения:', parsedData);
    
    // Обработка данных в зависимости от типа
    if (parsedData.type === 'profile') {
      // Обработка данных профиля
      handleProfileData(chatId, parsedData.data);
    } else if (parsedData.type === 'mealPlan') {
      // Обработка данных о плане питания
      handleMealPlanData(chatId, parsedData.data);
    } else if (parsedData.type === 'groceries') {
      // Обработка данных о списке покупок
      handleGroceryListData(chatId, parsedData.data);
    } else {
      bot.sendMessage(chatId, 'Получены данные: ' + JSON.stringify(parsedData));
    }
  } catch (error) {
    console.error('Ошибка при обработке данных из веб-приложения:', error);
    bot.sendMessage(chatId, 'Произошла ошибка при обработке данных');
  }
});

// Обработчик данных профиля
function handleProfileData(chatId, profileData) {
  // Форматируем сообщение о профиле
  const activityMap = {
    sedentary: 'сидячий образ жизни',
    light: 'легкая активность',
    moderate: 'умеренная активность',
    high: 'высокая активность',
    extreme: 'очень высокая активность'
  };
  
  const goalMap = {
    lose: 'снижение веса',
    maintain: 'поддержание веса',
    gain: 'набор веса'
  };
  
  const message = `
📋 Ваш профиль:
• Возраст: ${profileData.age} лет
• Пол: ${profileData.gender === 'male' ? 'мужской' : 'женский'}
• Вес: ${profileData.weight} кг
• Рост: ${profileData.height} см
• Активность: ${activityMap[profileData.activity] || profileData.activity}
• Цель: ${goalMap[profileData.goal] || profileData.goal}
• Бюджет: ${profileData.budget} руб/день
  `;
  
  bot.sendMessage(chatId, message, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Открыть план питания', web_app: { url: `${webAppUrl}/meal-plan` } }]
      ]
    }
  });
}

// Обработчик данных о плане питания
function handleMealPlanData(chatId, mealPlanData) {
  // Формируем сообщение о плане питания
  let message = `🍽️ Ваш план питания создан!\n\n`;
  
  // Добавляем информацию о калориях и нутриентах
  if (mealPlanData.dailyNutrition) {
    const nutrition = mealPlanData.dailyNutrition;
    message += `📊 Ежедневное питание:\n`;
    message += `• Калории: ${Math.round(nutrition.calories)} ккал\n`;
    message += `• Белки: ${Math.round(nutrition.protein)}г\n`;
    message += `• Жиры: ${Math.round(nutrition.fat)}г\n`;
    message += `• Углеводы: ${Math.round(nutrition.carbs)}г\n`;
    message += `• Бюджет: ${nutrition.budget} руб/день\n\n`;
  }
  
  // Добавляем краткую информацию о блюдах
  if (mealPlanData.dailyMeals && mealPlanData.dailyMeals.length > 0) {
    message += `🗓️ Меню составлено на ${mealPlanData.dailyMeals.length} дней\n`;
  }
  
  bot.sendMessage(chatId, message, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Список покупок', web_app: { url: `${webAppUrl}/grocery-list` } }]
      ]
    }
  });
}

// Обработчик данных о списке покупок
function handleGroceryListData(chatId, groceryListData) {
  // Подсчитываем общую стоимость и количество элементов
  const totalItems = groceryListData.length;
  const totalPrice = groceryListData.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const purchasedItems = groceryListData.filter(item => item.purchased).length;
  
  // Формируем сообщение
  let message = `🛒 Ваш список покупок:\n\n`;
  message += `• Всего продуктов: ${totalItems}\n`;
  message += `• Куплено: ${purchasedItems}\n`;
  message += `• Осталось купить: ${totalItems - purchasedItems}\n`;
  message += `• Общая стоимость: ${totalPrice.toFixed(2)} руб\n\n`;
  
  // Если есть некупленные товары, добавляем кнопку
  const keyboard = [];
  if (totalItems - purchasedItems > 0) {
    keyboard.push([{ text: 'Показать список покупок', web_app: { url: `${webAppUrl}/grocery-list` } }]);
  }
  
  // Добавляем кнопку поиска магазинов
  keyboard.push([{ text: 'Найти ближайшие магазины', web_app: { url: `${webAppUrl}/stores-map` } }]);
  
  bot.sendMessage(chatId, message, {
    reply_markup: {
      inline_keyboard: keyboard
    }
  });
}

// Обработка любых сообщений
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  
  // Если это не команда и не данные из веб-приложения, предлагаем открыть приложение
  if (!msg.text || (!msg.text.startsWith('/') && !msg.web_app_data)) {
    bot.sendMessage(chatId, 'Используйте меню или нажмите на кнопку ниже, чтобы открыть планировщик:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Открыть планировщик питания', web_app: { url: webAppUrl } }]
        ]
      }
    });
  }
});

console.log('Бот запущен!');