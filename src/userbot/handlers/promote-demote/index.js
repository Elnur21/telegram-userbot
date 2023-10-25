const { Api } = require("telegram")
const { _parseMessageText } = require("telegram/client/messageParse")
const { NewMessage } = require("telegram/events")

const promoteOrDemote = async event => {
  const {
    client,
    message } = event

  let editMessage = new Api.messages.EditMessage({
    id: message.id,
    message: '',
    peer: message.peerId,
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
    let text = 'hanya admin group yang dapat menggunakan cmd ini'
    editMessage.message = text
    return await client.invoke(editMessage)
  }

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
    let text  = '<b>Bantuan :</b>\n'
        text += '1. reply ke pesan user target!\n'
        text += '2. tambah username atau user_id target setelah command!\n\n'

        text += '<b>Contoh :</b>\n'
        text += '1. .demote 1234567890\n'
        text += '2. .promote @username custom title'

    let [ resText, entities ] = await _parseMessageText(client, text, 'html')
    editMessage.message = resText
    editMessage.entities = entities

    return await client.invoke(editMessage)
  }

  if ( isPromote && title.length > 16 ) {
    let text = 'panjang maksimal untuk custom title adalah 16 karakter!'
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

  let actionText = action === 'promote'
    ? 'dipromosikan menjadi admin'
    : 'diturunkan dari posisi admin'

  let successText = `${ target } telah ${ actionText }.`
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
