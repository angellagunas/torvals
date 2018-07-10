const createApp = require('../../tasks/pio-server/create-app')

module.exports = async function (job) {
  const a = await createApp.run(job.data)
  return a
}
