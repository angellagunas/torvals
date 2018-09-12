// node tasks/emails/send-email
require('../../config')

const Task = require('lib/task')
const Mailer = require('lib/mailer')

const task = new Task(async function (argv) {
  const {
    args,
    recipients,
    template,
    title
  } = argv

  const mailer = new Mailer(template)
  await mailer.format(args)

  console.log(recipients)
  try {
    await mailer.send({
      title,
      recipient: recipients
    })
  } catch (e) {
    console.log(`Error sending email: ${e}`)
    console.log(e)
    return false
  }

  console.log(`${title} Email Sent =>`, recipients)
  return true
})
if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
