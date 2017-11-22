// node tasks/addProducts.js --uuid uuid
require('../../config')
require('lib/databases/mongo')

const Task = require('lib/task')
const { Forecast } = require('models')

const task = new Task(async function (argv) {
  if (!argv.uuid) {
    throw new Error('You need to provide an uuid!')
  }

  console.log('Fetching specified Forcast...', argv.uuid)

  const forcast = await Forecast.findOne({uuid: argv.uuid})

  console.log('Forcast=>', forcast)
  if (!forcast) {
    throw new Error('Invalid uuid!')
  }

  console.log('Recreating add Sales Centers  to Forcast...')
  const salesCenters = [{
    '_id': '5a0e17816439dc8855da6b34',
    'name': 'App Segundo Centro de Ventas',
    'description': 'Donec sed odio dui. Nullam quis risus eget urna mollis ornare vel eu leo. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas faucibus mollis interdum. Sed posuere consectetur est at lobortis.',
    'organization': '5a01d2e4b3cc74a44562e0dd',
    'address': 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus.',
    'externalId': 'Sem',
    'isDeleted': false,
    'uuid': '8188799d-9dce-46f2-a4cc-89059a2b3b99',
    'dateCreated': '2017-11-16T22:56:01.394Z',
    '__v': 1
  }]
  await forcast.addSalesCenters(salesCenters)

  console.log('Successfully recreated add salesCenters to forcast')
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
