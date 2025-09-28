const bot = require('../src/bot')

// Ensure middlewares are registered before handling
// No need to call bot.start() in webhook mode

const { createWebhook } = bot

// Export handler for Vercel serverless (Node/Express style)
module.exports = (req, res) => {
  // grammy's webhook handler returns an express middleware
  return createWebhook()(req, res)
}


