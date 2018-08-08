const Route = require('lib/router/route')
const sendEmail = require('tasks/emails/send-email')

module.exports = new Route({
  method: 'post',
  path: '/',
  handler: async function (ctx) {
    const data = ctx.request.body

    const recipients = {
      email: 'jmonroy@grupoabraxas.com',
      name: 'Contacto Orax'
    }
    sendEmail.run({
      recipients,
      args: data,
      template: 'contact',
      title: 'Contacto Orax'
    })

    ctx.body = {success: true}
  }
})
