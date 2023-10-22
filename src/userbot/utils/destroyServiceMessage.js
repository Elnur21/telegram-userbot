const { Api } = require("telegram")

const destroyServiceMessage = async ( event, client ) => {
  let {
    UpdateNewChannelMessage,
    MessageService,
    UpdateNewMessage,
  } = Api

  if ( !event.updates.length ) return

  let newMessage = event.updates.filter(itm => {
    if ( itm instanceof UpdateNewChannelMessage ) return true
    else if ( itm instanceof UpdateNewMessage ) return true
    else return false
  })

  if ( !newMessage.length ) return
  else newMessage = newMessage[0]

  let service = newMessage?.message
  let isValidService = service instanceof MessageService
    ? true
    : false

  if ( !isValidService ) return

  try {
    let chatId = service.peerId
    let msgIds = [ service.id ]
    let option = { revoke: true }

    await client.deleteMessages(chatId, msgIds, option)
  } catch (err) {
    console.error(err)
  }
}

module.exports = destroyServiceMessage
