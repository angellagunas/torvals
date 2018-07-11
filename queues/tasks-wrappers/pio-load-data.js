const loadAppData = require('../../tasks/pio-server/load-data')

module.exports = async function (job) {
  const a = await loadAppData.run(job.data)
  return a
}
