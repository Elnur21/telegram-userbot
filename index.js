require('dotenv/config')

const fastify = require("fastify");
//const { client, initialize } = require("./src/userbot");

const port = process.env.PORT
const app = fastify({ logger: false })

app.get('/', async ( _, res ) => {
  //const status = await client.isUserAuthorized()
  //if ( status ) {
  //  await initialize()
  //}

  res.send({
    ok: true,
    is_connected: status
  })
})

app.listen({ port: parseInt(port) }, ( err, address ) => {
  if ( err ) {
    return console.error(err)
  }

  console.info(`server listening on ${ address }`)
})
