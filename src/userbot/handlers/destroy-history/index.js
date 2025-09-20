const { validation, languageManager } = require('../../utils')

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
      let userId = message.peerId?.userId || message.fromId?.userId
      if (!userId) return
      let text = languageManager.getText(userId, 'destroy_history.help')

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
      let userId = message.peerId?.userId || message.fromId?.userId
      if (!userId) return
      editMessage.message = languageManager.getText(userId, 'destroy_history.not_found', { user: participant })
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
    let userId = message.peerId?.userId || message.fromId?.userId
    if (!userId) return
    editMessage.message = languageManager.getText(userId, 'destroy_history.success', { target })

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
