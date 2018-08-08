// node tasks/emails/notification-request-activation
require('../../config')

const Task = require('lib/task')
const sendEmail = require('tasks/emails/send-email')

const task = new Task(async function (argv) {
  const {
    owner,
    organization,
    admins
  } = argv

  for (let admin of admins) {
    const data = {
      owner,
      name: admin.name,
      email: admin.email,
      organization: organization.name
    }
    const recipients = {
      email: admin.email,
      name: admin.name
    }
    sendEmail.run({
      recipients,
      args: data,
      template: 'notification-org-activation',
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
