const migrateRows = require('../../tasks/dataset/migrate-rows-to-historical')

module.exports = async function (job) {
  let a
  a = await migrateRows.run(job.data)
  return a
}
