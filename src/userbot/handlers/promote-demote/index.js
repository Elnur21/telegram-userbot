const { Api } = require("telegram")
const { _parseMessageText } = require("telegram/client/messageParse")
const { NewMessage } = require("telegram/events")
const { validation, languageManager } = require('../../utils')

const promoteOrDemote = async event => {
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

  let [ _, action, participant, title ] = message.patternMatch

  let target = participant
  let isPromote = action === 'promote' ? true : false

  if ( message.replyTo ) {
    let replied = await message.getReplyMessage()
    participant = replied.fromId

    let sender = await replied.getSender()
        target = sender?.username ? '@' + sender.username : sender.firstName
  }

  if ( !participant ) {
    let userId = message.peerId?.userId || message.fromId?.userId
    if (!userId) return
    let text = languageManager.getText(userId, 'promote_demote.help')

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

  if ( isPromote && title.length > 16 ) {
    let userId = message.peerId?.userId || message.fromId?.userId
    if (!userId) return
    let text = languageManager.getText(userId, 'promote_demote.title_too_long')
    editMessage.message = text

    return await client.invoke(editMessage)
  }

  let rightOptions = {
    changeInfo : isPromote,
    postMessages : isPromote,
    editMessages : isPromote,
    deleteMessages : isPromote,
    banUsers : isPromote,
    inviteUsers : isPromote,
    pinMessages : isPromote,
    addAdmins : isPromote,
    anonymous : false,
    manageCall : isPromote,
    other : isPromote,
    manageTopics : isPromote
  }

  let editAdmin = new Api.channels.EditAdmin({
    channel: message.peerId,
    userId: participant,
    adminRights: new Api.ChatAdminRights(rightOptions),
    rank: isPromote ? title || 'Admin' : ''
  })

  let userId = message.peerId?.userId || message.fromId?.userId
  if (!userId) return
  let successText = action === 'promote'
    ? languageManager.getText(userId, 'promote_demote.promoted', { target })
    : languageManager.getText(userId, 'promote_demote.demoted', { target })
  
  editMessage.message = successText

  try {
    await client.invoke(editAdmin)
  } catch (err) {
    editMessage.message = err.message
  } finally {
    await client.invoke(editMessage)
  }
}

module.exports = {
  handler: promoteOrDemote,
  event: new NewMessage({
    fromUsers: [ 'me' ],
    pattern: /^\.(promote|demote)\s*(@?\w*|\d*)\s*([\s\w]*)$/
  })
}
