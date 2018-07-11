const loadAppData = require('../../tasks/pio-server/create-batch-prediction-json')

module.exports = async function (job) {
  const a = await loadAppData.run(job.data)
  return a
}
