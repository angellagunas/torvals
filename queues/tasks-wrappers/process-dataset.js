const processDataset = require('../../tasks/dataset/process/process-dataset')

module.exports = async function (job) {
  let a
  a = await processDataset.run(job.data)
  return a
}
