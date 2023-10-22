require('dotenv/config')

const input = require('input')
const userbot = require('./src/userbot')

const { registerHandlers } = require('./src/userbot/utils')

;(async () => {
  await userbot.connect()
  const isAuthorized = await userbot.isUserAuthorized()

  if ( !isAuthorized ) {
    await userbot.start({
      phoneNumber: async () => await input.text("Nomor Ponsel (+62) : "),
      password: async () => await input.text("Kata Sandi : "),
      phoneCode: async () => await input.text("Kode Verifikasi : "),
      onError: err => console.log(err.message)
    });

    console.log(userbot.session.save())
    process.exit(1)
  }

  await registerHandlers(userbot)
  console.log('Tosca Userbot is up and running!!!')
})();
