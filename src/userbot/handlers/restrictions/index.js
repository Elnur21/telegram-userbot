const { Api } = require("telegram")
const { NewMessage } = require("telegram/events")
const { validation } = require('../../utils')
const { _parseMessageText } = require("telegram/client/messageParse")

const restriction = async event => {
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

  let [
    _,
    action,
    participant ] = message.patternMatch

  let target = participant

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
        text += '2. .unmute @username\n'
        text += '3. .ban @username\n'
        text += '4. .unban 5234567890\n'
        text += '5. .kick @username\n'

    let [ resText, entities ] = await _parseMessageText(client, text, 'html')
    editMessage.message = resText
    editMessage.entities = entities

    return await client.invoke(editMessage)
  }

  if ( typeof participant === 'string' ) {
    let expression = /^\d+$/
    if ( !participant.match(expression) && !participant.startsWith('@') ) {
      participant = '@' + participant
    }
  }

  let getParticipant = new Api.channels.GetParticipant({
    participant,
    channel: message.peerId,
  })

  let participantInfo
  try {
    participantInfo = await client.invoke(getParticipant)
  } catch (err) {
    if ( err.errorMessage !== 'USER_NOT_PARTICIPANT' ) {
      editMessage.message = err.message
      return await client.invoke(editMessage)
    }
  }

  if (
    action !== 'unban' &&
    ( !participantInfo || participantInfo.participant.left )
  ) {
    editMessage.message = `${ target } tidak ditemukan didalam group!!`
    return await client.invoke(editMessage)
  }

  let isTargetAdmin = participantInfo?.participant?.adminRights

  if ( isTargetAdmin ) {
    let text = `gagal melakukan ${ action }, karena target adalah admin!`
    editMessage.message = text

    return await client.invoke(editMessage)
  }

  let options
  let perform

  switch ( action ) {
    case 'mute':
      perform = 'telah dibisukan'
      options = { sendMessages: true }
      break;
    case 'unmute':
      perform = 'dapat berbicara kembali'
      options = { sendMessages: false }
      break;
    case 'ban':
      perform = 'telah dibanned dari group'
      options = { viewMessages: true, untilDate: 0 }
      break;
    case 'unban':
      perform = 'banned status telah dibuka'
      options = { viewMessages: false }
      break;
    default:
      perform = 'telah ditendang dari group'
      options = { viewMessages: true, untilDate: 0 }
      break;
  }

  let responses = `${ target } ${ perform }!`
  let editBanned = new Api.channels.EditBanned({
    channel: message.peerId,
    participant,
    bannedRights: new Api.ChatBannedRights(options)
  })

  try {
    await client.invoke(editBanned)
    if ( action === 'kick' ) {
      editBanned.bannedRights.viewMessages = false
      await client.invoke(editBanned)
    }
  } catch (err) {
    responses = err.message
  } finally {
    editMessage.message = responses
    await client.invoke(editMessage)
  }
}

module.exports = {
  handler: restriction,
  event: new NewMessage({
    fromUsers: [ 'me' ],
    pattern: /^\.(mute|unmute|ban|unban|kick)\s*(@?\w*|\d*)$/
  })
}
