const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

const config = require('./config');
const token = config.token;
const rapidApiKey = config.rapidApiKey;

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  const message = "Welcome to the Bhagavad Gita Bot! You can use the /Gita command followed by a chapter number (1-18) to get information about a specific chapter of the Bhagavad Gita.";
  bot.sendMessage(msg.chat.id, message);
});

bot.on('message', async (msg) => {
  try {
    if (msg.text.startsWith('/Gita')) {
      const chapterNumber = parseInt(msg.text.split(' ')[1]);
      
      if (!isNaN(chapterNumber) && chapterNumber >= 1 && chapterNumber <= 18) {
        const options = {
          method: 'GET',
          url: 'https://bhagavad-gita3.p.rapidapi.com/v2/chapters/',
          params: {  id: chapterNumber },
          headers: {
            'X-RapidAPI-Key': rapidApiKey,
            'X-RapidAPI-Host': 'bhagavad-gita3.p.rapidapi.com'
          }
        };

        const response = await axios.request(options);
        const chapter = response.data[chapterNumber-1];
        const chapterTitle = chapter.name_transliterated;
        const chapterContent = chapter.chapter_summary;
        const message = `${chapterTitle}\n\n${chapterContent}`;
        bot.sendMessage(msg.chat.id, message);
      } else {
        bot.sendMessage(msg.chat.id, 'Invalid chapter number. Please enter a number between 1 and 18.');
      }
    }
  } catch (error) {
    console.error('Error fetching data:', error.message);
    bot.sendMessage(msg.chat.id, 'An error occurred while fetching Bhagavad Gita information.');
  }
});
