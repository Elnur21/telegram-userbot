const { Api } = require("telegram")
const { NewMessage } = require("telegram/events")

const ping = async event => {
  const {
    client,
    message } = event

  let peer = message.peerId
  let resp = 'pong!!'

  let method = new Api.messages.EditMessage({
    peer,
    id: message.id,
    message: resp
  })

  try {
    await client.invoke(method)
  } catch (err) {
    console.error(err.message)
  }
}

module.exports = {
  handler: ping,
  event: new NewMessage({
    fromUsers: [ 'me' ],
    pattern: /^\.ping$/
  })
}
