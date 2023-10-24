const { Api } = require("telegram")
const { NewMessage } = require("telegram/events")

const muteOrUnmute = async event => {
  const {
    client,
    message } = event

  let editMessage = new Api.messages.EditMessage({
    peer: message.peerId,
    id: message.id,
    message: ''
  })

  if ( !message.isGroup || ( message.isGroup && !message.isChannel ) ) {
    let text = 'cmd ini hanya bisa digunakan dalam supergroup'
    editMessage.message = text
    return await client.invoke(editMessage)
  }

  let getParticipant = new Api.channels.GetParticipant({
    channel: message.peerId,
    participant: "me",
  })

  let {
    participant: { adminRights }
  } = await client.invoke(getParticipant)

  if ( !adminRights ) {
    let text = 'hanya admin yang dapat menggunakan cmd ini'
    editMessage.message = text
    return await client.invoke(editMessage)
  }

  let participant = message
    .message
    .replace(/((^\.mute)|(^\.unmute))\s*/, '')
    .trim()

  let target = participant
  let isMute = message.patternMatch[0] === '.mute'
    ? true
    : false

  if ( message.replyTo ) {
    let replied = await message.getReplyMessage()
    participant = replied.fromId

    let sender = await replied.getSender()
        target = sender?.username ? '@' + sender.username : sender.firstName
  }

  if ( !participant ) {
    let text  = '1. reply ke pesan user target!\n'
        text += '2. tambah username atau user_id target setelah command!'

    editMessage.message = text
    return await client.invoke(editMessage)
  }

  let editBanned = new Api.channels.EditBanned({
    channel: message.peerId,
    participant,
    bannedRights: new Api.ChatBannedRights({ sendMessages: isMute })
  })

  let performed = isMute ? 'telah dibisukan' : 'dapat berbicara kembali'
  let responses = `${ target } ${ performed }.`

  try {
    await client.invoke(editBanned)
  } catch (err) {
    responses = err.message
  } finally {
    editMessage.message = responses
    await client.invoke(editMessage)
  }
}

module.exports = {
  handler: muteOrUnmute,
  event: new NewMessage({
    fromUsers: [ 'me' ],
    pattern: /(^\.mute)|(^\.unmute)/
  })
}
