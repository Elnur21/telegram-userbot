const os = require('os')

const { TelegramClient } = require("telegram")
const { StringSession } = require("telegram/sessions")

const {
  API_ID,
  API_HASH,
  SESSION } = process.env

if ( !API_ID || !API_HASH || !SESSION ) {
  throw new Error('Missing userbot credentials!!')
}

const opts = {
  useWSS: true,
  connectionRetries: 5,
  testServers: false,
  deviceModel: 'Chrome 114',
  appVersion: '1.0.0',
  systemVersion: os.version(),
}

const sesion = new StringSession(SESSION)
const client = new TelegramClient(sesion, parseInt(API_ID), API_HASH, opts)

module.exports = client
