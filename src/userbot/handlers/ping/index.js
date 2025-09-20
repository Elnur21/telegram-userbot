const { Api } = require("telegram")
const { _parseMessageText } = require('telegram/client/messageParse')
const { NewMessage } = require("telegram/events")
const { languageManager } = require('../../utils')

const ping = async event => {
  
  const {
    client,
    message } = event

  let uptimeMs = Math.floor(process.uptime()) * 1000
  let date = new Date(uptimeMs)
  let segments = []

  let months  = date.getUTCMonth(),
      days    = date.getUTCDate() - 1,
      hours   = date.getUTCHours(),
      minutes = date.getUTCMinutes(),
      seconds = date.getUTCSeconds();

  let userId = message.peerId?.userId || message.fromId?.userId
  
  if (!userId) return
  
  if ( months > 0  ) segments.push(months + ' ' + languageManager.getText(userId, 'common.months'))
  if ( days > 0    ) segments.push(days + ' ' + languageManager.getText(userId, 'common.days'))
  if ( hours > 0   ) segments.push(hours + ' ' + languageManager.getText(userId, 'common.hours'))
  if ( minutes > 0 ) segments.push(minutes + ' ' + languageManager.getText(userId, 'common.minutes'))
  if ( seconds > 0 ) segments.push(seconds + ' ' + languageManager.getText(userId, 'common.seconds'))

  let calcPing = ( message.date * 1000 ) - new Date().getTime()
      calcPing = calcPing.toString().replace('-', '')

  let uptimeText = languageManager.getText(userId, 'ping.uptime', { time: segments.join(', ') })
  let pingText = languageManager.getText(userId, 'ping.ping', { ping: calcPing })

  let unformatedText = `${ pingText }\n${ uptimeText }`
  let [ text, entities ] = await _parseMessageText(client, unformatedText, 'html')

  let editMessage = new Api.messages.EditMessage({
    id: message.id,
    entities,
    message: text,
    peer: message.peerId,
  })

  try {
    await client.invoke(editMessage)
  } catch (err) {
    editMessage.entities = []
    editMessage.message = err.message
    await client.invoke(editMessage)
  }
}

module.exports = {
  handler: ping,
  event: new NewMessage({
    fromUsers: [ 'me' ],
    pattern: /^\.ping$/
  })
}
