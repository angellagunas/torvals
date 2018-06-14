const reconfigureDataset = require('../../tasks/dataset/process/reconfigure-dataset')

module.exports = async function (job) {
  let a
  a = await reconfigureDataset.run(job.data)
  return a
}
