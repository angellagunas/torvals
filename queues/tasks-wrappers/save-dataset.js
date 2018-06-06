const saveDataset = require('../../tasks/dataset/process/save-dataset')

module.exports = async function (job) {
  let a
  a = await saveDataset.run(job.data)
  return a
}
