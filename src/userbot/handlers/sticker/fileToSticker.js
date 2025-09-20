const { Api } = require("telegram")
const { NewMessage } = require("telegram/events")
const { CustomFile } = require("telegram/client/uploads")

const {
  converter,
  conversation } = require('../../utils')

const toSticker = async event => {
  const {
    client,
    message } = event

  let editMessage = new Api.messages.EditMessage({
    id: message.id,
    message: '',
    peer: message.peerId,
  })

  if ( !message.isReply ) {
    let text = 'reply ke media yang akan diubah menjadi stiker!'
    editMessage.message = text
    return await client.invoke(editMessage)
  }

  let replied = await message.getReplyMessage()
  let { media } = replied

  if ( !media || ( !media.photo && !media.document ) ) {
    let text = 'pastikan untuk me-reply pesan foto, video, atau gif!'
    editMessage.message = text
    return await client.invoke(editMessage)
  }

  let isImage = false
  let isVideo = false
  let isSticker = false

  let mediaData = {
    name: message.date.toString()
  }

  if ( media.document ) {
    let attributes = media.document.attributes

    for ( let attr of attributes ) {
      if ( attr instanceof Api.DocumentAttributeImageSize ) isImage = true
      if ( attr instanceof Api.DocumentAttributeVideo ) isVideo = true
      if ( attr instanceof Api.DocumentAttributeSticker ) isSticker = true
    }
  } else {
    isImage = true
  }

  if ( !isVideo && !isImage || ( isImage && isSticker ) ) {
    let text = 'pastikan untuk me-reply pesan foto, video, atau gif!'
    editMessage.message = text
    return await client.invoke(editMessage)
  }

  if ( isImage ) mediaData.convertTo = 'png'
  if ( isVideo ) mediaData.convertTo = 'webm'

  editMessage.message = 'Processing media...\nThis may take a while, please wait!'
  await client.invoke(editMessage)

  let buffer = await client.downloadMedia(replied)

  let convertMedia = isImage ? converter.imageToPng : converter.videoToWebm
  let fileName = ''
  let convertedBuffer = undefined

  try {
    convertedBuffer = await convertMedia(buffer)
    fileName = `${ mediaData.name }.${ mediaData.convertTo }`
  } catch ( err ) {
    editMessage.message = err.message
    return await client.invoke(editMessage)
  }

  let data = {
    from: message,
    type: isImage ? 'image' : 'video',
    file: convertedBuffer,
    name: fileName,
    edit: editMessage,
    replyTo: replied
  }

  let option = {
    onSuccess: oldOrNew,
    onTimeout: () => console.log('oldOrNewSticker timeout'),
    pattern: /(^Choose a sticker set\.$)|(\/new(pack|animated))/gm,
    timeoutMs: 5000,
    data,
    target: '@stickers'
  }

  conversation(client, option)
  await client.sendMessage('@stickers', { message: '/addsticker' })
}

const oldOrNew = async ( event, data ) => {
  let option = {
    onSuccess: undefined,
    onTimeout: undefined,
    pattern: undefined,
    timeoutMs: 5000,
    data: undefined,
    target: '@stickers'
  }

  let { client, message } = event
  let markups = message.replyMarkup

  let sender = await data.from.getSender()
  let senderId = parseInt(sender.id)

  let senderName = sender.username
    ? `@${ sender.username }`
    : sender.lastName
      ? `${ sender.firstName } ${ sender.lastName }`
      : `${ sender.firstName }`

  let shortPackName = `TUB_${ senderId }_${ data.type === 'image' ? 'IMG' : 'VID' }_V`
  let packName = `${ senderName } x || ${ data.type === 'image' ? 'IMG' : 'VID' } V`

  if ( message.message.includes('/newpack') ) {
    data = {
      ...data,
      isNew: true,
      packName: `${ packName }1`,
      shortPackName: `${ shortPackName }1`
    }

    option = {
      ...option,
      data,
      onSuccess: sendPackName,
      onTimeout: () => console.log('sendPackName timeout'),
      pattern: /(Now choose a name for your set\.$)|(new set of video stickers\.)/
    }

    let command = data.type === 'image' ? '/newpack' : '/newvideo'
    conversation(client, option)
    return await client.sendMessage(data.target, { message: command })
  }

  let stickerPacks = []
  for ( let row of markups.rows ) {
    let buttons = row.buttons
    for ( let button of buttons ) { stickerPacks.push(button.text) }
  }

  let validPacks = stickerPacks
    .filter(pack => pack.startsWith(shortPackName))

  if ( !validPacks?.length ) {
    data = {
      ...data,
      isNew: true,
      packName: `${ packName }1`,
      shortPackName: `${ shortPackName }1`
    }

    option = {
      ...option,
      data,
      onSuccess: sendPackName,
      onTimeout: () => console.log('sendPackName timeout'),
      pattern: /(Now choose a name for your set\.$)|(new set of video stickers\.)/
    }

    let command = data.type === 'image' ? '/newpack' : '/newvideo'
    conversation(client, option)
    return await client.sendMessage(data.target, { message: command })
  }

  let highest = validPacks
    .map(itm => ({ ver: itm.slice(-1), shortName: itm }))
    .reduce((prev, curr) => (prev && prev.ver > curr.ver) ? prev : curr)

  data = {
    ...data,
    shortPackName: highest.shortName
  }

  option = {
    ...option,
    data,
    onSuccess: sendMedia,
    onTimeout: () => console.log('sendMedia timeout'),
    pattern: /^(Alright\! Now send me the (video )?sticker\.)/gm
  }

  conversation(client, option)
  await client.sendMessage(data.target, { message: highest.shortName })
}

const sendPackName = async ( event, data ) => {
  let client = event.client

  let option = {
    onSuccess: sendMedia,
    onTimeout: () => console.log('sendMedia timeout'),
    pattern: /^(Alright\! Now send me the (video )?sticker\.)/gm,
    timeoutMs: 5000,
    data,
    target: '@stickers'
  }

  conversation(client, option)
  await client.sendMessage(data.target, { message: data.packName })
}

const sendMedia = async ( event, data ) => {
  let client = event.client

  let option = {
    onSuccess: sendEmoji,
    onTimeout: () => console.log('sendEmoji timeout'),
    pattern: /^(Thanks\! Now send me an emoji)/gm,
    timeoutMs: 5000,
    data,
    target: '@stickers'
  }

  let {
    file: buffer,
    name: fileName,
  } = data

  let toUpload = new CustomFile(fileName, buffer.length, '', buffer)
  let file = await client.uploadFile({ file: toUpload })

  conversation(client, option)
  await client.sendFile(data.target, { file, forceDocument: true })
}

const sendEmoji = async ( event, data ) => {
  let client = event.client

  let option = {
    onSuccess: data.isNew ? publishSticker : sendDone,
    onTimeout: () => console.log(`${ data.isNew ? 'publishSticker' : 'sendDone' } timeout`),
    data,
    pattern: data.isNew ? /(\/publish command\.)$/gm : /(\/done command\.)$/gm,
    timeoutMs: 5000,
    target: '@stickers'
  }

  conversation(client, option)

  let emoji = '🗿'
  await client.sendMessage(data.target, { message: emoji })
}

const publishSticker = async ( event, data ) => {
  let client = event.client

  let option = {
    onSuccess: skipIcon,
    onTimeout: () => console.log('skipIcon timeout'),
    pattern: /^(You can \/skip this step.)/gm,
    timeoutMs: 5000,
    data,
    target: '@stickers'
  }

  conversation(client, option)

  let command = '/publish'
  await client.sendMessage(data.target, { message: command })
}

const skipIcon = async ( event, data ) => {
  let client = event.client

  let option = {
    onSuccess: sendShortName,
    onTimeout: () => console.log('sendShortName timeout'),
    pattern: /^(Please provide a short name for your set\.)/gm,
    timeoutMs: 5000,
    data,
    target: '@stickers'
  }

  conversation(client, option)

  let command = '/skip'
  await client.sendMessage(data.target, { message: command })
}

const sendShortName = async ( event, data ) => {
  let client = event.client

  let option = {
    onSuccess: getStickerPack,
    onTimeout: () => console.log('getStickerPack timeout'),
    pattern: /(^Kaboom\!)|(^OK\, well done\!$)/gm,
    timeoutMs: 5000,
    data,
    target: '@stickers'
  }

  conversation(client, option)

  let shortName = data.shortPackName
  await client.sendMessage(data.target, { message: shortName })
}

const sendDone = async ( event, data ) => {
  let client = event.client

  let option = {
    onSuccess: getStickerPack,
    onTimeout: () => console.log('getStickerPack timeout'),
    pattern: /(^Kaboom\!)|(^OK\, well done\!$)/gm,
    timeoutMs: 5000,
    data,
    target: '@stickers'
  }

  conversation(client, option)
  await client.sendMessage(data.target, { message: '/done' })
}

const getStickerPack = async ( event, data ) => {
  let client = event.client

  let {
    shortPackName,
    replyTo,
    from: { peerId: chatId } } = data

  let getStickerSet = new Api.messages.GetStickerSet({
    stickerset: new Api.InputStickerSetShortName({ shortName: shortPackName })
  })

  let stickerSet = await client.invoke(getStickerSet)
  let sticker = stickerSet.documents[ stickerSet.documents.length - 1 ]

  await data.from.delete()
  await client.sendFile(chatId, { file: sticker, replyTo: replyTo })
}

module.exports = {
  handler: toSticker,
  event: new NewMessage({ fromUsers: [ 'me' ], pattern: /^\.ts$/gm })
}
