const { Api } = require("telegram")
const { NewMessage } = require("telegram/events")

const ping = async event => {
  const {
    client,
    message } = event

  let peer = message.peerId
  let resp = 'pong'

  await client.invoke(
    new Api.messages.EditMessage({
      peer,
      id: message.id,
      message: resp
    })
  )
}

module.exports = {
  handler: ping,
  event: new NewMessage({
    outgoing: true,
    pattern: /^\.ping$/
  })
}
