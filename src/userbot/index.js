const os = require('os')
const app = require('../../package.json')

const { TelegramClient } = require("telegram")
const { StringSession } = require("telegram/sessions")

const {
  API_ID,
  API_HASH,
  SESSION } = process.env

const platform = os.platform()
const released = os.release()

const model = platform === 'darwin' ? 'Mac'
  : platform === 'win32' ? 'Windows'
  : platform === 'android' ? 'Android'
  : platform === 'linux' ? 'Linux' : 'Chrome'

const opts = {
  useWSS: true,
  connectionRetries: 5,
  testServers: false,
  deviceModel: model + ' OS',
  appVersion: app.version,
  systemVersion: released,
}

const sesion = new StringSession(SESSION || '')
const client = new TelegramClient(sesion, parseInt(API_ID), API_HASH, opts)

client.setLogLevel('info')
client.setParseMode('html')

module.exports = client
