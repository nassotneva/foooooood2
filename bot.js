const TelegramBot = require('node-telegram-bot-api');

// Используйте переменную окружения для хранения токена бота
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
if (!TOKEN) {
  console.error('Ошибка: Не задан токен бота. Пожалуйста, укажите TELEGRAM_BOT_TOKEN в переменных окружения.');
  process.exit(1);
}

// Создаем экземпляр бота
const bot = new TelegramBot(TOKEN, { polling: true });

// URL вашего приложения (замените на актуальный после деплоя)
// Для тестирования в Replit используйте домен вида: https://your-repl-name.your-username.repl.co
const webAppUrl = process.env.WEB_APP_URL || 'https://your-app-url.replit.app';

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
    
    // Здесь можно добавить логику обработки полученных данных
    bot.sendMessage(chatId, 'Данные успешно получены!');
  } catch (error) {
    console.error('Ошибка при обработке данных из веб-приложения:', error);
    bot.sendMessage(chatId, 'Произошла ошибка при обработке данных');
  }
});

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