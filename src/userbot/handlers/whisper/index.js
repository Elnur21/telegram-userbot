const bot = require('../../../bot')

const { Api } = require("telegram")
const { NewMessage } = require("telegram/events")

const whisper = async event => {
  let {
    client,
    message } = event

  // delete the message immediately hoping nobody sees it :v
  // note : mods can always see it in recent action.
  await message.delete()

  let sendMessage = new Api.messages.SendMessage({
    peer: message.peerId,
    message: '',
  })

  let isFromGroups = event.isGroup && !event.isChannel
    ? true
    : event.isGroup && event.isChannel
      ? true
      : false

  if ( !isFromGroups ) {
    let text = 'Whisper only available inside a group chat!'
    sendMessage.message = text
    return await client.invoke(sendMessage)
  }

  let pattern = /^\.whisper\s+(@{1}\w{5,}\s+)?([\d\D\w\W\n]+)/g
  let [ _, toId, toSend ] = pattern.exec(message.message)

  if ( toSend.length >= 200 ) {
    toSend = toSend.slice(0, 197) + '...'
  }

  let replied

  if ( message.isReply ) {
    replied = await message.getReplyMessage()
    toId = replied.fromId ? parseInt(replied.fromId.userId) : toId
  }

  if ( !toId ) {
    let text = 'Reply to recipient message or provide his/her username!'
    sendMessage.message = text
    return await client.invoke(sendMessage)
  }

  let userInfo
  let getUsers = new Api.users.GetUsers({ id: [ toId ] })

  try {
    userInfo = await client.invoke(getUsers)
    userInfo = userInfo[0]
  } catch (err) {
    sendMessage.message = err.message
    return await client.invoke(sendMessage)
  }

  let fromId = parseInt(message.fromId.userId)
  let target = parseInt(userInfo.id)

  if ( target === fromId ) {
    let text = 'You cannot send whisper to yourself!'
    sendMessage.message = text
    return await client.invoke(sendMessage)
  }

  let displayName = userInfo.username
    ? '@' + userInfo.username
    : userInfo.lastName
      ? userInfo.firstName + ' ' + userInfo.lastName
      : userInfo.firstName

  let inputQuery = `-dn:${ displayName }-t:${ target }-m:${ toSend }`
  let botUsername = bot.botInfo.username

  let getInlineResults = new Api.messages.GetInlineBotResults({
    bot: botUsername,
    query: inputQuery,
    peer: message.peerId,
    offset: ''
  })

  let result
  let chosen

  try {
    result = await client.invoke(getInlineResults)
    chosen = result.results[0]
  } catch (err) {
    sendMessage.message = err.message
    return await client.invoke(sendMessage)
  }

  let inputReply = new Api.InputReplyToMessage()
  if ( replied ) {
    inputReply.replyToMsgId = replied.id
  }

  let sendInlineResult = new Api.messages.SendInlineBotResult({
    id: chosen.id,
    replyTo: inputReply,
    peer: message.peerId,
    queryId: result.queryId,
  })

  await client.invoke(sendInlineResult)
}

module.exports = {
  handler: whisper,
  event: new NewMessage({
    fromUsers: [ 'me' ],
    pattern: /^\.whisper\s+(@{1}\w{5,}\s+)?(.+)/g
  })
}
