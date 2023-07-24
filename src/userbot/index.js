const os = require('os')
const { handler, event } = require('./features/ping')

const { TelegramClient } = require("telegram")
const { StringSession } = require("telegram/sessions")

const {
  API_ID,
  API_HASH,
  SESSION } = process.env

if ( !API_ID || !API_HASH || !SESSION ) {
  throw new Error('Missing client credentials!!')
}

const client = new TelegramClient(
  new StringSession(SESSION),
  parseInt(API_ID),
  API_HASH,
  {
    useWSS: true,
    connectionRetries: 5,
    testServers: false,
    deviceModel: 'Chrome 114',
    appVersion: "1.0.0",
    systemVersion: os.version(),
  }
)

const initialize = async () => {
  client.setLogLevel('none')

  await client.connect()
  await client.getDialogs()

  client.addEventHandler(handler, event)
}

module.exports = {
  initialize,
  client
}
