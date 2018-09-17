const removeDuplicatedCatalogsAnomalies = require('../../tasks/anomalies/remove-duplicated-catalogs-anomalies')

module.exports = async function (job) {
  let a
  a = await removeDuplicatedCatalogsAnomalies.run(job.data)
  return a
}
