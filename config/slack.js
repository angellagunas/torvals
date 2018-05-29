const slack = {
  active: process.env.SLACK_ACTIVE === 'true',
  name: process.env.SLACK_NAME || 'N/A',
  channels: {
    opskamino: process.env.SLACK_HOOK_URL_OPSKAMINO
  }
}

module.exports = slack
