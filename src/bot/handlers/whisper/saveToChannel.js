const { Composer } = require("grammy");

const { _parseMessageText } = require('telegram/client/messageParse')
const { Api } = require('telegram')
const userbot = require('../../../userbot')

const saveToChannel = async ctx => {
  let chosen = ctx.chosenInlineResult
  let btnCData = chosen.result_id.replace('whisper', '')

  let pattern = /\-t\:\d+\-m\:([\w\W\d\D\n]+)/gm
  let [ _, message ] = pattern.exec(chosen.query)

  let toSave  = `<code>#WHISPER${ btnCData }</code>\n\n${ message.trim() }`
  let [ text, entities ] = await _parseMessageText(userbot, toSave, 'html')

  let sendMessage = new Api.messages.SendMessage({
    peer: process.env.DB_CHANNEL_ID,
    message: text,
    entities
  })

  await userbot.invoke(sendMessage)
}

const patterns = /^whisper\-/g
const composer = new Composer()
      composer.chosenInlineResult(patterns, saveToChannel)

module.exports = composer
