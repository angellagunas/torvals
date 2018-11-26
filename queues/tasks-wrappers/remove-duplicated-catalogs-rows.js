const removeDuplicatedCatalogsRows = require('../../tasks/dataset/remove-duplicated-catalogs-rows')

module.exports = async function (job) {
  let a
  a = await removeDuplicatedCatalogsRows.run(job.data)
  return a
}
