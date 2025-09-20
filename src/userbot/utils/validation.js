const { Api } = require("telegram")
const languageManager = require("./language")

const admin = async ( client, peer, editMessage ) => {
  let getParticipant = new Api.channels.GetParticipant({
    channel: peer,
    participant: "me",
  })

  let { participant: { adminRights } } = await client.invoke(getParticipant)
  if ( adminRights ) return true

  let text = languageManager.getText(peer.userId, 'only_group_admins')
  editMessage.message = text

  await client.invoke(editMessage)
  return false
}

const supergroup = async ( client, message, editMessage ) => {
  if ( message.isGroup && message.isChannel ) {
    return true
  }

  let text = languageManager.getText(message.peerId.userId, 'supergroup_only')
  editMessage.message = text

  await client.invoke(editMessage)
  return false
}

module.exports = {
  admin,
  supergroup
}
