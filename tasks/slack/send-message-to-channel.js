// node tasks/slack/send-message-to-channel --channel opskamino --message "John Doe is a new contact!"
require('../../config')

const Task = require('lib/task')
const Slack = require('node-slack')
const moment = require('moment')
const config = require('config').slack

const task = new Task(async function (argv) {
  let hookUrl
  if (!config.active) return false

  if (!argv.channel) {
    throw new Error('channel is required')
  }

  if (!argv.message && !argv.attachment) {
    throw new Error('message is required')
  }

  let message = {}

  if (argv.message) {
    message.text = `*[${config.name}]* ${argv.message} (_${moment().format()}_)`
  }

  if (argv.attachment) {
    message.attachments = [argv.attachment]
  }

  if (argv.channel === 'all') {
    for (let channel of Object.keys(config.channels)) {
      if (!config.channels[channel]) {
        continue
      }

      const slack = new Slack(config.channels[channel])
      await slack.send(message)
    }
  } else {
    hookUrl = config.channels[argv.channel]

    if (!hookUrl) {
      throw new Error('hook url is required')
    }

    const slack = new Slack(hookUrl)
    await slack.send(message)
  }
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
