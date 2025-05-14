#!/bin/bash
export NODE_ENV=production
export WEB_APP_URL="https://$REPL_SLUG.$REPL_OWNER.repl.co"
echo "Запуск Telegram бота для адреса: $WEB_APP_URL"
node bot.mjs
