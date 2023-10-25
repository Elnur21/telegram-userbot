const { Api } = require("telegram")
const { _parseMessageText } = require("telegram/client/messageParse")
const { NewMessage } = require("telegram/events")
const { validation } = require('../../utils')

const toggleSlowmode = async event => {
  let {
    client,
    message } = event

  let editMessage = new Api.messages.EditMessage({
    id: message.id,
    message: '',
    peer: message.peerId,
  })

  let isSupergroup = await validation.supergroup(client, message, editMessage)
  if ( !isSupergroup ) return

  let isAdmin = await validation.admin(client, message.peerId, editMessage)
  if ( !isAdmin ) return

  let arg = message.patternMatch[1]
  let res = arg === 'off' ? 0 : parseInt(arg)

  let validSeconds = [
    10,      // 10 second
    30,      // 30 second
    60,      // 1 minute
    60 * 5,  // 5 minute,
    60 * 15, // 15 minute,
    60 * 60, // 1 hour
  ]

  if ( arg !== 'off' && !validSeconds.includes(res) ) {
    // make it readable.
    let formatedIntervals = validSeconds.map(sec => {
      let timesT = sec >= 60 ? 'menit' : 'detik'
      let format = sec >= 60 ? sec / 60 : sec
      let result = `<code>${ sec } = ${ format } ${ timesT }</code>`

      return result
    })

    let text  = '<b>Bantuan :</b>\n'
        text += '1. Matikan slowmode : .slow off\n'
        text += '2. Aktifkan slowmode : .slow interval\n\n'

        text += '<b>Interval :</b>\n'
        text += formatedIntervals.join('\n')

    let [ resText, entities ] = await _parseMessageText(client, text, 'html')
    editMessage.message = resText
    editMessage.entities = entities

    return await client.invoke(editMessage)
  }

  let slowGroup = new Api.channels.ToggleSlowMode({
    seconds: res,
    channel: message.peerId,
  })

  let text = res === 0 ? 'dinonaktifkan' : `diaktifkan dengan durasi ${ res } detik.`
  editMessage.message = `slowmode berhasil ${ text }`

  try {
    await client.invoke(slowGroup)
  } catch (err) {
    if ( err.errorMessage === 'CHAT_NOT_MODIFIED' ) {
      err.message = arg === 'off'
        ? 'slowmode telah dinonaktifkan!'
        : 'slowmode telah aktif dengan durasi ' + res + ' detik!'
    }
    editMessage.message = err.message
  } finally {
    await client.invoke(editMessage)
  }
}

module.exports = {
  handler: toggleSlowmode,
  event: new NewMessage({
    fromUsers: [ 'me' ],
    pattern: /^\.slow\s*(\d+|off)$/
  })
}
