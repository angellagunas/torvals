const cloneProject = require('../../tasks/project/clone')

module.exports = async function (job) {
  let a
  a = await cloneProject.run(job.data)
  return a
}
