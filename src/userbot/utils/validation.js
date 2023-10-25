const { Api } = require("telegram")

const admin = async ( client, peer, editMessage ) => {
  let getParticipant = new Api.channels.GetParticipant({
    channel: peer,
    participant: "me",
  })

  let { participant: { adminRights } } = await client.invoke(getParticipant)
  if ( adminRights ) return true

  let text = 'hanya admin group yang dapat menggunakan command ini'
  editMessage.message = text

  await client.invoke(editMessage)
  return false
}

const supergroup = async ( client, message, editMessage ) => {
  if ( message.isGroup && message.isChannel ) {
    return true
  }

  let text = 'command ini hanya bisa digunakan dalam supergroup'
  editMessage.message = text

  await client.invoke(editMessage)
  return false
}

module.exports = {
  admin,
  supergroup
}
