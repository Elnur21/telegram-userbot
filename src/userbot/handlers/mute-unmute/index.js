const { Api } = require("telegram")
const { NewMessage } = require("telegram/events")
const { validation } = require('../../utils')
const { _parseMessageText } = require("telegram/client/messageParse")

const muteOrUnmute = async event => {
  const {
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

  let [ _, action, participant ] = message.patternMatch

  let target = participant
  let isMute = action === 'mute' ? true : false

  if ( message.replyTo ) {
    let replied = await message.getReplyMessage()
    participant = replied.fromId

    let sender = await replied.getSender()
        target = sender?.username ? '@' + sender.username : sender.firstName
  }

  if ( !participant ) {
    let text  = '<b>Bantuan :</b>\n'
        text += '1. reply ke pesan user target!\n'
        text += '2. tambah username atau user_id target setelah command!\n\n'

        text += '<b>Contoh :</b>\n'
        text += '1. .mute 1234567890\n'
        text += '2. .unmute @username'

    let [ resText, entities ] = await _parseMessageText(client, text, 'html')
    editMessage.message = resText
    editMessage.entities = entities

    return await client.invoke(editMessage)
  }

  if ( !participant.startsWith('@') ) {
    participant = '@' + participant
  }

  let editBanned = new Api.channels.EditBanned({
    channel: message.peerId,
    participant,
    bannedRights: new Api.ChatBannedRights({ sendMessages: isMute })
  })

  let performed = isMute ? 'telah dibisukan' : 'dapat berbicara kembali'
  let responses = `${ target } ${ performed }.`

  try {
    await client.invoke(editBanned)
  } catch (err) {
    responses = err.message
  } finally {
    editMessage.message = responses
    await client.invoke(editMessage)
  }
}

module.exports = {
  handler: muteOrUnmute,
  event: new NewMessage({
    fromUsers: [ 'me' ],
    pattern: /^\.(mute|unmute)\s*(@?\w*|\d*)$/
  })
}
