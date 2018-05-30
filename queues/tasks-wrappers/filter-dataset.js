const filterDataset = require('../../tasks/dataset/process/filter-dataset')

module.exports = async function (job) {
  let a
  a = await filterDataset.run(job.data)
  return a
}
