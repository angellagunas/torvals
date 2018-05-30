const saveDatasetrows = require('../../tasks/dataset/process/save-datasetrows')

module.exports = async function (job) {
  let a
  a = await saveDatasetrows.run(job.data)
  return a
}
