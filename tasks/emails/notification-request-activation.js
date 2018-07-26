// node tasks/emails/notification-request-activation
require('../../config')

const Task = require('lib/task')
const Mailer = require('lib/mailer')

const task = new Task(async function (argv) {
  const {
    owner,
    organization,
    admins
  } = argv

  const mailer = new Mailer('notification-org-activation')

  for (let admin of admins) {
    await mailer.format({
      name: admin.name,
      email: admin.email,
      organization: organization.name,
      owner: owner
    })

    await mailer.send({
      recipient: {
        email: admin.email,
        name: admin.name
      },
      title: 'Notificación de requerimiento de activación de organización en Orax.'
    })

    console.log('Activation Admin Notification Email Sent =>', admin.email)
  }
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
