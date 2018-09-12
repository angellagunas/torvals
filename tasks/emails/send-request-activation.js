// node tasks/emails/send-request-activation
require('../../config')

const Task = require('lib/task')
const sendEmail = require('tasks/emails/send-email')

const task = new Task(async function (argv) {
  const {
    uuid,
    name,
    email,
    organization
  } = argv

  const data = {
    name,
    email,
    organization
  }

  const recipients = {
    email,
    name
  }
  sendEmail.run({
    recipients,
    args: data,
    template: 'request-org-activation',
    title: 'Confirmación de requerimiento de activación recibido.'
  })

  console.log('Request Activation Notification Email Sent =>', email, uuid)
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
