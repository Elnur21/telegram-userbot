const { Bot, webhookCallback } = require('grammy')
const whisper = require('./handlers/whisper')

const token = process.env.BOT_TOKEN
const bot = new Bot(token)

bot.use(whisper.initWhisper)
bot.use(whisper.displayMessage)
bot.use(whisper.saveToChannel)

module.exports = bot

// Export a factory that returns an Express-compatible webhook handler
module.exports.createWebhook = function createWebhook() {
  return webhookCallback(bot, 'express')
}
