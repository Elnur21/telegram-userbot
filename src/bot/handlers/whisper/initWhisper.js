const userbot = require('../../../userbot')

const {
  Composer,
  InlineKeyboard,
  InlineQueryResultBuilder } = require("grammy")

const whisper = async ctx => {
  let inline = ctx.inlineQuery

  let fromId = inline.from.id
  if ( parseInt(fromId) !== parseInt(userbot.me) ) return

  let pattern = /^\-dn\:(.+)\-t\:(\d+)/gm
  let [ _, toMention, toId ] = pattern.exec(inline.query)

  let btnCData = `-id:${ inline.id }-f:${ fromId }-t:${ toId }`
  let keyboard = new InlineKeyboard().text('Open 🔐', btnCData)

  let text = `Whisper to ${ toMention }\nonly he/she can open this message.`
  let articleId = `whisper${ btnCData }`

  let result = InlineQueryResultBuilder
    .article(articleId, 'WHISPER', { reply_markup: keyboard })
    .text(text, { parse_mode: 'HTML' })

  await ctx.answerInlineQuery([ result ], { cache_time: 0 })
}

const patterns = /^\-dn\:(.+)\-t\:(\d+)\-m\:(.+)/g
const composer = new Composer()
      composer.inlineQuery(patterns, whisper)

module.exports = composer
