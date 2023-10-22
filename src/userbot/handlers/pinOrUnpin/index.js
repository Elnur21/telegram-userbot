const { Api } = require("telegram")
const { NewMessage } = require("telegram/events")
const { destroyServiceMessage } = require('../../utils')

const pinOrUnpin = async event => {
  const {
    client,
    message } = event

  let peer = message.peerId

  if ( !message.replyTo ) {
    let method = new Api.messages.EditMessage({
      peer,
      id: message.id,
      message: 'Reply pada pesan yang akan di pin!!'
    })
    return await client.invoke(method)
  }

  let isUnpin = message.patternMatch[0] !== '.pin'
    ? true
    : false

  let method = new Api.messages.UpdatePinnedMessage({
    peer: peer,
    id: message.replyTo.replyToMsgId,
    unpin: isUnpin,
    pmOneside: false,
  })

  let res
  let failed

  try {
    res = await client.invoke(method)
  } catch (err) {
    failed = true
    await message.edit(err.message)
  } finally {
    if ( failed ) return
    if ( !isUnpin ) {
      await destroyServiceMessage(res, client)
    }
  }
}

module.exports = {
  handler: pinOrUnpin,
  event: new NewMessage({
    fromUsers: [ 'me' ],
    pattern: /(^\.pin$)|(^\.unpin$)/
  })
}
