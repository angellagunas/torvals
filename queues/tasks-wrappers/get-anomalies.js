const getAnomalies = require('../../tasks/anomalies/get-anomalies')

module.exports = async function (job) {
  let a
  a = await getAnomalies.run(job.data)
  return a
}
