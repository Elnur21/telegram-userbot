const { Api } = require("telegram")
const { _parseMessageText } = require('telegram/client/messageParse')
const { NewMessage } = require("telegram/events")

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

  if ( months > 0  ) segments.push(months + ' bulan')
  if ( days > 0    ) segments.push(days + ' hari')
  if ( hours > 0   ) segments.push(hours + ' jam')
  if ( minutes > 0 ) segments.push(minutes + ' menit')
  if ( seconds > 0 ) segments.push(seconds + ' detik')

  let calcPing = ( message.date * 1000 ) - new Date().getTime()
      calcPing = calcPing.toString().replace('-', '')

  let uptimeText = `<b>Uptime :</b> ${ segments.join(', ') }`
  let pingText = `<b>Ping :</b> ${ calcPing }ms`

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
