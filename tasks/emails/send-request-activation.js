// node tasks/emails/send-request-activation
require('../../config')

const Task = require('lib/task')
const Mailer = require('lib/mailer')

const task = new Task(async function (argv) {
  const {
    uuid,
    name,
    email,
    organization
  } = argv

  const mailer = new Mailer('request-org-activation')
  await mailer.format({
    name,
    email,
    organization
  })
  await mailer.send({
    recipient: {
      email,
      name
    },
    title: 'Confirmación de requerimiento de activación recibido.'
  })

  console.log('Request Activation Notifiaction Email Sent =>', email, uuid)
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
