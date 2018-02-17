// node tasks/datasetsRows/get-dates.js
require('../../config')
require('lib/databases/mongo')

const Api = require('lib/abraxas/api')
const Task = require('lib/task')
const { AbraxasDate } = require('models')
const request = require('lib/request')

const task = new Task(async function (argv) {
  console.log('Fetching Dates ...')

  console.log('Obtaining Abraxas API token ...')
  await Api.fetch()
  const apiData = Api.get()

  var options = {
    url: `${apiData.hostname}${apiData.baseUrl}/dates`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiData.token}`
    },
    body: {},
    json: true,
    persist: true
  }

  var res = await request(options)

  for (var d of res._items) {
    var date = await AbraxasDate.findOne({externalId: d._id})

    if (!date) {
      await AbraxasDate.create({
        dateStart: d.start_date,
        dateEnd: d.end_date,
        externalId: d._id,
        week: d.week,
        month: d.month,
        year: d.year
      })
    }
  }

  console.log(`Received ${res._items.length} dates!`)
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
