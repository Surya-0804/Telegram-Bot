const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const config=request("./JokeConfig");
const token =config.token;
const request = require('request');
const bot = new TelegramBot(token, {polling: true});


bot.on('message',function(msg){
    request('https://v2.jokeapi.dev/joke/Any', function(err, responce, body){
        bot.sendMessage(msg.chat.id, body);
    })

})