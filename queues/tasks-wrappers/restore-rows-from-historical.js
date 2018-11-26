const restoreRows = require('../../tasks/dataset/restore-rows-from-historical')

module.exports = async function (job) {
  let a
  a = await restoreRows.run(job.data)
  return a
}
