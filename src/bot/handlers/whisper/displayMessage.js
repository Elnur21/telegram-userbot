const { Composer } = require('grammy')

const userbot = require('../../../userbot')
const { Api } = require('telegram')

const displayMessage = async ctx => {
  let cbQuery = ctx.callbackQuery

  let pattern = /^\-id\:(\d+)\-f\:(\d+)\-t\:(\d+)$/g
  let [ _raw, _uniqueId, fromId, toId ] = pattern.exec(cbQuery.data)

  let isAuthorized = [ fromId, toId ].includes(cbQuery.from.id.toString())
  if ( !isAuthorized ) {
    let alertText  = 'Access Denied 🚫\nUnable to see this message 🔒'
    return await ctx.answerCallbackQuery({
      text: alertText,
      show_alert: true
    })
  }

  let searchQuery = `#WHISPER${ cbQuery.data }`
  let dbChannel = process.env.DB_CHANNEL_ID

  let searchMessage = new Api.messages.Search({
    peer: dbChannel,
    limit: 1,
    q: searchQuery,
    filter: new Api.InputMessagesFilterEmpty()
  })

  let searched = await userbot.invoke(searchMessage)
  if ( !searched.count ) {
    let text  = 'Data Not Found 🚫\n'
        text += 'This message has expired 🗑'

    await ctx.answerCallbackQuery({ text: text, show_alert: true })
    return await ctx.editMessageReplyMarkup([])
  }

  let dbMessage = searched.messages[0]
  let savedText = dbMessage.message.replace(searchQuery + '\n\n', '').trim()

  await ctx.answerCallbackQuery({ text: savedText, show_alert: true })
}

const patterns = /^\-id\:(\d+)\-f\:(\d+)\-t\:(\d+)$/g
const composer = new Composer()
      composer.callbackQuery(patterns, displayMessage)

module.exports = composer
