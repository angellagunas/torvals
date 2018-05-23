// node tasks/slack/send-message-to-channel --channel opskamino --message "John Doe is a new contact!"
require('../../config')

const Task = require('lib/task')
const Slack = require('node-slack')
const config = require('config').slack

const task = new Task(async function (argv) {
  if (!config.useSlack) return false

  const hookUrl = config.channels[argv.channel]

  if (!argv.channel) {
    throw new Error('channel is required')
  }

  if (!argv.message) {
    throw new Error('message is required')
  }

  if (!hookUrl) {
    throw new Error('hook url is required')
  }

  const slack = new Slack(hookUrl)
  await slack.send({ text: argv.message })
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
