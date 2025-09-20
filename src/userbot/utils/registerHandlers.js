const path = require('path')
const fs = require('fs/promises')

const registerHandlers = async client => {
  let handlersDir = path.join(__dirname, '..', 'handlers')
  let validHandlers = []
  let handlers = await fs.readdir(handlersDir)

  for ( let handler of handlers ) {
    let handlerPath = path.join(handlersDir, handler)

    let stats = await fs.stat(handlerPath)
    let isDir = stats.isDirectory()

    if ( !isDir ) continue
    else validHandlers.push(handlerPath)
  }

  for ( let handler of validHandlers ) {
    let hn = handler.split('/')
    let moduleName = hn[ hn.length - 1 ]

    let file = await fs.readdir(handler)
        file = file.filter(name => name !== 'index.js' ? false : true )

    if ( !file?.length ) {
      console.log(`[FAIL] register ${ moduleName }`)
      continue
    }

    let exported = require(path.join(handler, file[0]))

    if ( exported?.[ Symbol.iterator ] ) {
      for ( let expr of exported ) {
        client.addEventHandler(expr.handler, expr.event)
      }

      console.log(`[SUCCESS] register ${ moduleName }`)
      continue
    }

    if ( !exported?.handler || !exported?.event ) {
      console.log(`[FAIL] register ${ moduleName }`)
      continue
    }

    console.log(`[SUCCESS] register ${ moduleName }`)
    client.addEventHandler(exported.handler, exported.event)
  }
}

module.exports = registerHandlers
