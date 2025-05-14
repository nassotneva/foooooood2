import { spawn } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
 
// Проверяем наличие токена бота
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('Ошибка: Не задан токен бота. Пожалуйста, укажите TELEGRAM_BOT_TOKEN в переменных окружения.');
  process.exit(1);
}

// Запускаем бота как дочерний процесс
console.log('Запуск Telegram бота...');
const botProcess = spawn('node', ['bot.js'], {
  stdio: 'inherit',
  env: process.env
});

botProcess.on('exit', (code) => {
  console.log(`Процесс бота завершен с кодом: ${code}`);
});

// Обработка завершения работы
process.on('SIGINT', () => {
  console.log('Завершение работы бота...');
  botProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Завершение работы бота...');
  botProcess.kill('SIGTERM');
  process.exit(0);
});

console.log('Бот запущен и работает. Нажмите Ctrl+C для завершения.');