// node tasks/addProducts.js --uuid uuid
require('../../config')
require('lib/databases/mongo')

const Task = require('lib/task')
const { Forecast } = require('models')

const task = new Task(async function (argv) {
  if (!argv.uuid) {
    throw new Error('You need to provide an uuid!')
  }

  console.log('Fetching specified Forecast...', argv.uuid)

  const forecast = await Forecast.findOne({uuid: '7d158589-6e3a-442a-8ecc-3ea813afd200'})

  if (!forecast) {
    throw new Error('Invalid uuid!')
  }

  console.log('Recreating add Products to Forecast...')
  const products = [{
    '_id': '5a0f7418c71bc19c08179f25',
    'name': 'asdasd',
    'description': '',
    'cost': 2212212.42,
    'organization': '5a01d2e4b3cc74a44562e0dd',
    'isDeleted': false,
    'uuid': 'bd63d06a-acfd-4dc6-b6b4-f87c99316bba',
    'dateCreated': '2017-11-17T23:43:20.747Z',
    '__v': 0
  }]
  await forecast.addProducts(products)

  console.log('Successfully recreated add products to Forecast')
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
