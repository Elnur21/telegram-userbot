const { NewMessage } = require("telegram/events")

const waitRespond = ( client, option ) => {
  let timeout = null

  let newMessageEvent = new NewMessage({
    pattern: option.pattern,
    fromUsers: [ option.target ],
  })

  let handler = async event => {
    if ( !event.isPrivate ) return

    clearTimeout(timeout)
    client.removeEventHandler(handler, newMessageEvent)

    option.onSuccess(event, { ...option.data, target: option.target })
  }

  let timeoutHandler = () => {
    option.onTimeout()
    client.removeEventHandler(handler, newMessageEvent)
  }

  client.addEventHandler(handler, newMessageEvent)
  timeout = setTimeout(timeoutHandler, option.timeoutMs)
}

module.exports = waitRespond
