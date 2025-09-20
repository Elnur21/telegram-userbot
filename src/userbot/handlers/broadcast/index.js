const { Api } = require("telegram")
const { NewMessage } = require("telegram/events")
const { languageManager } = require('../../utils')

const broadcast = async event => {
  const {
    client,
    message } = event

  let peer = message.peerId

  let method = new Api.messages.EditMessage({
    peer,
    id: message.id,
    message: ''
  })

  let messageToSend = message.replyTo
    ? await message.getReplyMessage()
    : message.message?.replace(/\.bc\s*/, '')

  if ( !messageToSend ) {
    let userId = message.peerId?.userId || message.fromId?.userId
    if (!userId) return
    let text = languageManager.getText(userId, 'broadcast.help')

    method.message = text
    return await client.invoke(method)
  }

  let dialogs = await client.getDialogs({})

  let results = dialogs.filter(dialog => {
    let left = dialog.entity?.left
    let deak = dialog.entity?.deactivated

    if ( !dialog.isGroup || ( left || deak ) ) return false
    else return true
  })

  try {
    let userId = message.peerId?.userId || message.fromId?.userId
    if (!userId) return
    method.message = languageManager.getText(userId, 'broadcast.sending', { count: results.length })
    await client.invoke(method)
  } catch (err) {
    return console.error(err.message)
  }

  let callback = async ( dialog, index ) => {
    let entity = dialog.inputEntity
    let option = { message: messageToSend }

    try {
      await client.sendMessage(entity, option)
    } catch (err) {
      console.error(err)
    } finally {
      if ( index + 1 < results.length ) return
    }

    try {
      let userId = message.peerId?.userId || message.fromId?.userId
      if (!userId) return
      method.message = languageManager.getText(userId, 'broadcast.completed')
      await client.invoke(method)
    } catch (err) {
      console.error(err)
    }
  }

  for ( let [ index, dialog ] of results.entries() ) {
    let time = ( index + 1 ) * 500
    setTimeout(() => callback(dialog, index), time)
  }
}

module.exports = {
  handler: broadcast,
  event: new NewMessage({
    fromUsers: [ 'me' ],
    pattern: /^\.bc/
  })
}
