const slack = {
  active: process.env.SLACK_ACTIVE === 'true',
  name: process.env.SLACK_NAME || 'N/A',
  channels: {
    commonsense: process.env.SLACK_HOOK_URL_COMMONSENSE,
    orax: process.env.SLACK_HOOK_URL_ORAX
  }
}

module.exports = slack
