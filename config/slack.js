const slack = {
  useSlack: process.env.USE_SLACK === 'true',
  channels: {
    opskamino: process.env.SLACK_HOOK_URL_OPSKAMINO
  }
}

module.exports = slack
