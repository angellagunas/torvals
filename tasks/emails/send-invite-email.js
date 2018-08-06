// node tasks/emails/send-email --uuid
require('../../config')

const Task = require('lib/task')
const Mailer = require('lib/mailer')
const { User, UserToken } = require('models')

const task = new Task(async function (argv) {
  const {
    uuid
  } = argv

  const title = 'Invitación a Orax'
  const template = 'invite'

  let user = await User.findOne({
    uuid: uuid
  })

  let userToken = await UserToken.create({
    user: user._id,
    validUntil: moment().add(10, 'days').utc(),
    type: 'invite'
  })

  const url = process.env.APP_HOST + '/emails/invite?token=' + userToken.key + '&email=' + encodeURIComponent(user.email)

  const email = new Mailer(template)
  await email.format({
    url
  })
  await email.send({
    recipient: {
      email: user.email,
      name: user.name
    },
    title: title
  })
  console.log(`${title} Email Sent =>`, email, uuid)
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
