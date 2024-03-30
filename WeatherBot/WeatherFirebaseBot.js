const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const serviceAccount = require('./key.json'); 
const config=require("./config.js");
const firebaseApp = initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore(firebaseApp);
const token = config.token;
const weatherApiKey =config.weatherApiKey; 
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `Welcome! I am your Weather bot.
     /weather [city] - Get current weather information for a city
    /help - Show this help message
    /getmessages - Retrieve your sent messages`);
  });
  
bot.on('message', (msg) => {
  saveMessageToFirestore(msg);
  var Hi = "hi";
  if (msg.text.toString().toLowerCase().indexOf(Hi) === 0) {
    bot.sendMessage(msg.from.id, "Hello  " + msg.from.first_name);
  }
  var bye = "bye";
  if (msg.text.toString().toLowerCase().includes(bye)) {
    bot.sendMessage(msg.chat.id, "Hope to see you around again, Bye");
  }
  if (msg.text.toLowerCase().startsWith('/weather')) {
    const city = msg.text.split(' ')[1];
    if (!city) {
      bot.sendMessage(msg.chat.id, 'Please provide a city name. Example: /weather London');
      return;
    }

    getWeather(city)
      .then((weatherData) => {
        saveWeatherToFirestore(msg.from.id, city, weatherData);
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

  if (msg.text.toLowerCase() === '/help') {
    const helpMessage = `Welcome! Here are some available commands:
      /weather [city] - Get current weather information for a city
      /help - Show this help message
      /getmessages - Retrieve your sent messages`;
    bot.sendMessage(msg.chat.id, helpMessage);
  }

  if (msg.text.toLowerCase() === '/getmessages') {
    getMessagesFromFirestore(msg.from.id)
      .then((messages) => {
        const messageText = messages.map((message) => `(${message.timestamp.toDate().toLocaleString()}) ${message.text}`).join('\n');
        bot.sendMessage(msg.chat.id, `Your messages:\n${messageText}`);
      })
      .catch((error) => {
        console.error('Error retrieving messages:', error);
        bot.sendMessage(msg.chat.id, 'Unable to retrieve your messages at the moment. Please try again later.');
      });
  }
});

function saveMessageToFirestore(msg) {
  const userRef = db.collection('users').doc(msg.from.id.toString());
  const messagesRef = userRef.collection('messages').doc(msg.message_id.toString());

  messagesRef.set({
    text: msg.text,
    timestamp: Timestamp.fromDate(new Date(msg.date * 1000)), 
  });
}

function saveWeatherToFirestore(userId, city, weatherData) {
  if (!userId || !city) {
    console.error('Invalid userId or city:', userId, city);
    return;
  }

  const userRef = db.collection('users').doc(userId.toString());
  const weatherRef = userRef.collection('weather').doc(city);

  weatherRef.set({
    temperature: weatherData.current.temp_c,
    description: weatherData.current.condition.text,
    timestamp: new Date(),
  });
}

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

async function getMessagesFromFirestore(userId) {
  const userRef = db.collection('users').doc(userId.toString());
  const messagesRef = userRef.collection('messages');
  
  const snapshot = await messagesRef.get();
  const messages = [];
  
  snapshot.forEach((doc) => {
    messages.push(doc.data());
  });

  return messages;
}
