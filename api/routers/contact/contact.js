const Route = require('lib/router/route')
const Mailer = require('lib/mailer')

module.exports = new Route({
  method: 'post',
  path: '/',
  handler: async function (ctx) {
    const data = ctx.request.body
    const email = new Mailer('contact')

    await email.format(data)
    await email.send({
      recipient: {
        email: 'contacto@grupoabraxas.com',
        name: 'Contacto Orax'
      },
      title: 'Contacto Orax'
    })

    ctx.body = {success: true}
  }
})
