const loadAppData = require('../../tasks/pio-server/engine-build')

module.exports = async function (job) {
  const a = await loadAppData.run(job.data)
  return a
}
