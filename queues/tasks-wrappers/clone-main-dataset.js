const cloneMainDataset = require('../../tasks/project/clone-main-dataset')

module.exports = async function (job) {
  let a
  a = await cloneMainDataset.run(job.data)
  return a
}
