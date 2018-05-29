const conciliateDataset = require('../../tasks/dataset/process/conciliate-dataset')

module.exports = async function (job) {
  let a
  a = await conciliateDataset.run(job.data)
  return a
}
