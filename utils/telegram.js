const axios = require('axios');

async function sendTelegramMessage(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    await axios.post(url, {
      chat_id: chatId,
      text: message
    });
    console.log('📨 Telegram mesajı gönderildi');
  } catch (err) {
    console.error('❌ Telegram gönderim hatası:', err.message);
  }
}

module.exports = sendTelegramMessage;