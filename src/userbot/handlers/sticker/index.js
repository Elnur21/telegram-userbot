const fts = require('./fileToSticker')
const stf = require('./stickerToFile')

module.exports = [
  { handler: fts.handler, event: fts.event },
  { handler: stf.handler, event: stf.event }
]
