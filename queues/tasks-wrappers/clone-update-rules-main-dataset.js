const updateRules = require('../../tasks/project/clone-update-rules-main-dataset')

module.exports = async function (job) {
  let a
  a = await updateRules.run(job.data)
  return a
}
