require('dotenv/config')

const fastify = require("fastify");
//const { client, initialize } = require("./src/userbot");

const app = fastify({ logger: false })

app.get('/', async ( _, res ) => {
 // const status = await client.isUserAuthorized()
 // if ( status ) {
 //   await initialize()
 // }

  res.send({
    ok: true,
    is_connected: null
  })
})

app.listen({ port: 3000 }, async ( err, address ) => {
  if ( err ) {
    return console.error(err)
  }

  console.info(`server listening on ${ address }`)
})
