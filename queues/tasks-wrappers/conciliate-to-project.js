const conciliateToProject = require('../../tasks/project/conciliate-to-project')

module.exports = async function (job) {
  let a
  a = await conciliateToProject.run(job.data)
  return a
}
