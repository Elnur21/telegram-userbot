const { Api } = require("telegram")
const { _parseMessageText } = require("telegram/client/messageParse")
const { NewMessage } = require("telegram/events")
const languageManager = require('../../utils/language')

const languageHandler = async event => {
  const {
    client,
    message } = event

  let editMessage = new Api.messages.EditMessage({
    id: message.id,
    message: '',
    peer: message.peerId,
  })

  let userId = message.peerId?.userId || message.fromId?.userId
  if (!userId) return
  let [_, language] = message.patternMatch

  if (!language) {
    // Show current language and available languages
    const currentLang = languageManager.getUserLanguage(userId)
    const supportedLangs = languageManager.getSupportedLanguages()
    
    let text = languageManager.getText(userId, 'language.current', { 
      lang: languageManager.getLanguageName(currentLang) 
    })
    text += '\n\n' + languageManager.getText(userId, 'language.available')
    
    const languageList = supportedLangs
      .map(lang => `<code>${lang}</code> - ${languageManager.getLanguageName(lang)}`)
      .join('\n')
    
    text += '\n' + languageList

    let [resText, entities] = await _parseMessageText(client, text, 'html')
    editMessage.message = resText
    editMessage.entities = entities

    return await client.invoke(editMessage)
  }

  // Set new language
  const success = languageManager.setUserLanguage(userId, language.toLowerCase())
  
  if (success) {
    const langName = languageManager.getLanguageName(language.toLowerCase())
    const text = languageManager.getText(userId, 'language.changed', { 
      lang: langName 
    })
    editMessage.message = text
  } else {
    const supportedLangs = languageManager.getSupportedLanguages().join(', ')
    const text = languageManager.getText(userId, 'language.invalid', { 
      languages: supportedLangs 
    })
    editMessage.message = text
  }

  try {
    await client.invoke(editMessage)
  } catch (err) {
    editMessage.entities = []
    editMessage.message = err.message
    await client.invoke(editMessage)
  }
}

module.exports = {
  handler: languageHandler,
  event: new NewMessage({
    fromUsers: ['me'],
    pattern: /^\.lang\s*(\w*)$/
  })
}
