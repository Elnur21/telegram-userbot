const { validation } = require('../../utils')

const { Api } = require("telegram")
const { NewMessage } = require("telegram/events")
const { _parseMessageText } = require('telegram/client/messageParse')

const deleteHistory = async event => {
  const {
    client,
    message } = event

  let editMessage = new Api.messages.EditMessage({
    id: message.id,
    entities: [],
    message: '',
    peer: message.peerId,
  })

  let isSupergroup = await validation.supergroup(client, message, editMessage)
  if ( !isSupergroup ) return

  let isAdmin = await validation.admin(client, message.peerId, editMessage)
  if ( !isAdmin ) return

  let target
  let [ _, participant ] = message.patternMatch

  let replyTo = message.replyTo

  if ( replyTo && (
     ( replyTo.forumTopic && replyTo.replyToTopId ) ||
     ( !replyTo.forumTopic && replyTo.replyToMsgId ) )
  ){
    let replied = await message.getReplyMessage()
    participant = replied.fromId

    let sender = await replied.getSender()
        target = sender?.username ? '@' + sender.username : sender.firstName
  } else {
    if ( !participant ) {
      let text  = '<b>Bantuan :</b>\n'
          text += '1. reply ke pesan user target!\n'
          text += '2. tambah username atau user_id target setelah command!\n\n'

          text += '<b>Contoh :</b>\n'
          text += '1. .destroy 1234567890\n'
          text += '2. .destroy @username'

      let [ resText, entities ] = await _parseMessageText(client, text, 'html')
      editMessage.message = resText
      editMessage.entities = entities

      return await client.invoke(editMessage)
    }

    let expression = /^\d+$/
    if (
      participant !== 'me' &&
      ( !participant.match(expression) && !participant.startsWith('@') )
    ) {
      participant = '@' + participant
    }

    let options = {
      limit: 1,
      fromUser: participant
    }

    let { total } = await client.getMessages(message.peerId, options)
    if ( !total ) {
      editMessage.message = `tidak menemukan pesan dari ${ participant } untuk dihapus!`
      return await client.invoke(editMessage)
    }
  }

  let deleteParticipantHistory = new Api.channels.DeleteParticipantHistory({
    participant,
    channel: message.peerId,
  })

  let result = {}
  let offset = 1

  while ( offset ) {
    try {
      let res = await client.invoke(deleteParticipantHistory)
      offset = res.offset
    } catch (err) {
      result.error = err.message
      offset = 0
    }
  }

  if ( result.error ) {
    editMessage.message = result.error
    return await client.invoke(editMessage)
  }

  try {
    target = target ? target : participant
    editMessage.message = `semua pesan dari ${ target } telah dihapus!`

    await client.invoke(editMessage)
  } catch (err) {
    let opts = {
      message: editMessage.message,
      replyTo: replyTo
    }
    await client.sendMessage(message.peerId, opts)
  }
}

module.exports = {
  handler: deleteHistory,
  event: new NewMessage({
    fromUsers: [ 'me' ],
    pattern: /^\.destroy\s*(\d*|\@?\w*)$/
  })
}
