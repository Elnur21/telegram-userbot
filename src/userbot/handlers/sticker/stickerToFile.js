const { Api } = require('telegram')
const { NewMessage } = require('telegram/events')
const { CustomFile } = require('telegram/client/uploads')

const toFile = async event => {
  let {
    client,
    message } = event

  let editMessage = new Api.messages.EditMessage({
    id: message.id,
    message: '',
    peer: message.peerId,
  })

  if ( !message.replyTo ) {
    editMessage.message = 'reply pada sticker yang akan diubah menjadi file!'
    return await client.invoke(editMessage)
  }

  let replied = await message.getReplyMessage()
  let document = replied?.media?.document

  if ( document?.mimeType === 'application/x-tgsticker' ) {
    editMessage.message = 'saat ini tidak dapat mengubah stiker animasi menjadi file!!'
    return await client.invoke(editMessage)
  }

  let attributes = document?.attributes
  let attrs = []
  let valid = []
  let stickerClass = Api.DocumentAttributeSticker
  let fileNameClass = Api.DocumentAttributeFilename

  if ( !attributes?.[ Symbol.iterator ] ) {
    editMessage.message = 'pastikan untuk reply pada pesan sticker!'
    return await client.invoke(editMessage)
  }

  for ( let attr of attributes ) {
    let isSticker = attr instanceof stickerClass ? true : false
    let isDocAttr = attr instanceof fileNameClass ? true : false

    valid.push(isSticker)
    if ( isDocAttr ) attrs.push(attr)
  }

  if ( !valid.includes(true) ) {
    editMessage.message = 'pastikan untuk reply pada pesan sticker!'
    return await client.invoke(editMessage)
  }

  let imageExtensions = [ 'jpg', 'jpeg', 'png', 'webp' ]
  let videoExtensions = [ 'mp4', 'webm', 'mkv', 'mov' ]

  let splited = attrs[0].fileName.split('.')
  let extension = splited[ splited.length - 1 ]

  if (
    imageExtensions.includes(extension) &&
    !videoExtensions.includes(extension)
  ) {
    extension = 'jpeg'
  } else if (
    videoExtensions.includes(extension) &&
    !imageExtensions.includes(extension)
  ) {
    extension = 'mp4'
  } else {
    return console.log(`unsupported extension : .${ extension }`)
  }

  let fileName = `${ message.date }.${ extension }`
  let buffer = await client.downloadMedia(replied)

  let toUpload = new CustomFile(fileName, buffer.length, '', buffer)
  let file = await client.uploadFile({ file: toUpload })

  await client.sendMessage(message.peerId, { file, replyTo: replied })
  await message.delete()
}

module.exports = {
  handler: toFile,
  event: new NewMessage({ fromUsers: [ 'me' ], pattern: /^\.tf$/ })
}
