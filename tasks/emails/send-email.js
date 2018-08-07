// node tasks/emails/send-email
require('../../config')

const Task = require('lib/task')
const Mailer = require('lib/mailer')

const task = new Task(async function (argv) {
  const {
    args,
    email,
    name,
    template,
    title
  } = argv

  const mailer = new Mailer(template)
  await mailer.format(args)

  try {
    await mailer.send({
      recipient: {
        email,
        name
      },
      title: title
    })
  } catch (e) {
    console.log(`Error sending email: ${e}`)
  }

  console.log(`$(title) Email Sent =>`, email, uuid)
})
if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
