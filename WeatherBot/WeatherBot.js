const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const config=require("./config");
const token = config.token;
const weatherApiKey =config.weatherApiKey; 
const bot = new TelegramBot(token, {polling: true});
bot.on('message', (msg) => {
    var Hi = "hi";
    if (msg.text.toString().toLowerCase().indexOf(Hi) === 0) {
        bot.sendMessage(msg.from.id, "Hello  " + msg.from.first_name);
    }
    var bye = "bye";
    if (msg.text.toString().toLowerCase().includes(bye)) {
        bot.sendMessage(msg.chat.id, "Hope to see you around again , Bye");
    }
    if (msg.text.toLowerCase().startsWith('/weather')) {
        const city = msg.text.split(' ')[1];
        if (!city) {
          bot.sendMessage(msg.chat.id, 'Please provide a city name. Example: /weather London');
          return;
        }
        getWeather(city)
          .then((weatherData) => {
            const message = `Current weather in ${city}:
              Temperature: ${weatherData.current.temp_c}°C
              Description: ${weatherData.current.condition.text}`;
            bot.sendMessage(msg.chat.id, message);
          })
          .catch((error) => {
            console.error('Error fetching weather:', error);
            bot.sendMessage(msg.chat.id, 'Unable to fetch weather information at the moment. Please try again later.');
          });
      }
    });
    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, "Welcome"+msg.from.first_name);  
    })
        async function getWeather(city) {
          const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${weatherApiKey}`;
          try {
              const response = await axios.get(apiUrl);
              const temperature = response.data.main.temp;
              const description = response.data.weather[0].description;
      
              return { current: { temp_c: temperature, condition: { text: description } } };
          } catch (error) {
              throw error;
          }
      }