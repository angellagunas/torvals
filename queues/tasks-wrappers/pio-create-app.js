const createForecast = require('../../tasks/pio/create')

module.exports = async function (job) {
  const a = await createForecast.run(job.data)
  return a
}
