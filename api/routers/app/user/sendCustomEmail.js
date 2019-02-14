const Route = require('lib/router/route')
const { User } = require('models')
const sendEmail = require('tasks/emails/send-email')

module.exports = new Route({
  method: 'post',
  path: '/sendEmail',
  handler: async function (ctx) {
    const data = ctx.request.body

    let users = await User.find({
      isDeleted: false,
      isOperationalUser: true,
      'organizations.organization': ctx.state.organization
    })

    users = users.map(user => ({ name: user.name, email: user.email }))

    sendEmail.run({
      recipients: users,
      args: {
        body: data.body
      },
      template: 'custom-email',
      title: data.subject
    })

    ctx.body = {
      data: true
    }
  }
})
