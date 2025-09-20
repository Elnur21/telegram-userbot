const { default: axios } = require("axios")

const { Api } = require("telegram")
const { _parseMessageText } = require('telegram/client/messageParse')
const { NewMessage } = require("telegram/events")
const { languageManager } = require('../../utils')

const eval1 = async event => {
  const {
    client,
    message } = event

  let editMessage = new Api.messages.EditMessage({
    id: message.id,
    entities: [],
    message: '',
    peer: message.peerId,
  })

  let [
    _,
    lang,
    query ] = message.patternMatch

  let apiRequest = async ( url, method, data = {} ) => {
    let res

    let headers = {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json;charset=utf-8',
    }

    try {
      let req = await axios(url, { method, headers, data })
          res = req.data
    } catch (err) {
      res = { error: true, message: err.response.data }
    }

    return res
  }

  if ( !query || !lang ) {
    let url = 'https://emkc.org/api/v2/piston/runtimes'
    let res = await apiRequest(url, 'GET')

    if ( res.error ) {
      editMessage.message = res.message.message
      return await client.invoke(editMessage)
    }

    let languageList = res
      .map(itm => `<code>${ itm.language }</code>`)
      .join(', ')

    let userId = message.peerId?.userId || message.fromId?.userId
    if (!userId) return
    let txt = languageManager.getText(userId, 'eval.help')
    txt += '\n' + languageList

    let [ text, entities ] = await _parseMessageText(client, txt, 'html')
    editMessage.message = text
    editMessage.entities = entities

    return await client.invoke(editMessage)
  }

  let data = {
    language: lang,
    version: "*",
    files: [{ content: query }],
    stdin: ""
  }

  let url = 'https://emkc.org/api/v2/piston/execute'
  let res = await apiRequest(url, 'POST', data)

  if ( res.error ) {
    let text = res.message.message
    editMessage.message = text
    return await client.invoke(editMessage)
  }

  let result = res.run.stdout || res.run.stderr
  let formatedLang = res.language.charAt(0).toUpperCase() + res.language.slice(1)
  let userId = message.peerId?.userId || message.fromId?.userId
  if (!userId) return

  let resultText = languageManager.getText(userId, 'eval.result', {
    language: formatedLang,
    code: `<pre><code class="language-${ res.language }">${ query }</code></pre>`,
    output: `<pre><code class="language-shell">${ result }</code></pre>`
  })

  let [
    text,
    entities ] = await _parseMessageText(client, resultText, 'html')

  editMessage.message = text
  editMessage.entities = entities

  try {
    await client.invoke(editMessage)
  } catch (err) {
    editMessage.entities = []
    editMessage.message = err.message
    await client.invoke(editMessage)
  }
}

module.exports = {
  handler: eval1,
  event: new NewMessage({
    fromUsers: [ 'me' ],
    pattern: /^\.eval\s*(\w*)\s*([\w\W]*)/
  })
}
