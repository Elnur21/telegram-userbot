const fs = require('fs')
const path = require('path')

const DEFAULT_LANGUAGE = 'en'
const SUPPORTED_LANGUAGES = ['en', 'az']

const userLanguages = {}

class LanguageManager {
  constructor() {
    this.languages = {}
    this.loadLanguages()
  }

  loadLanguages() {
    const languagesDir = path.join(__dirname, 'languages')
    
    for (const lang of SUPPORTED_LANGUAGES) {
      try {
        const langFile = path.join(languagesDir, `${lang}.json`)
        const content = fs.readFileSync(langFile, 'utf8')
        this.languages[lang] = JSON.parse(content)
      } catch (error) {
        console.error(`Failed to load language ${lang}:`, error.message)
      }
    }
  }

  getUserLanguage(userId) {
    console.log(userLanguages);
    
    return userLanguages[userId] || DEFAULT_LANGUAGE
  }

  setUserLanguage(userId, language) {
    if (SUPPORTED_LANGUAGES.includes(language)) {
      userLanguages[userId] = language
      return true
    }
    return false
  }

  getText(userId, key, replacements = {}) {
    const language = this.getUserLanguage(userId)
    console.log(language, userId);
    
    const langData = this.languages[language] || this.languages[DEFAULT_LANGUAGE]
    
    const keys = key.split('.')
    let text = langData
    
    for (const k of keys) {
      if (text && typeof text === 'object') {
        text = text[k]
      } else {
        const defaultData = this.languages[DEFAULT_LANGUAGE]
        text = defaultData
        for (const k2 of keys) {
          if (text && typeof text === 'object') {
            text = text[k2]
          } else {
            return key 
          }
        }
        break
      }
    }

    if (typeof text !== 'string') {
      return key
    }

    return this.replacePlaceholders(text, replacements)
  }

  replacePlaceholders(text, replacements) {
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return replacements[key] !== undefined ? replacements[key] : match
    })
  }

  getSupportedLanguages() {
    return SUPPORTED_LANGUAGES
  }

  getLanguageName(code) {
    const names = {
      'en': 'English',
      'az': 'Azərbaycan'
    }
    return names[code] || code
  }
}

const languageManager = new LanguageManager()

module.exports = languageManager
