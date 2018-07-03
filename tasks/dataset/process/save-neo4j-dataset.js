require('../../../config')
require('lib/databases/mongo')

const _ = require('lodash');

const neo4j = require('lib/databases/neo4j')
const Task = require('lib/task')
const Organization = require('models/neo4j/organization')
const CatalogItem = require('models/neo4j/catalog-item')
const { DataSet, DataSetRow } = require('models')


const task = new Task(
  async function (argv) {
    let log = (args) => {
      args = ('[save_dataset neo4j] ') + args
    }

    if (!argv.uuid) {
      throw new Error('You need to provide an uuid!')
    }

    const dataset = await DataSet.findOne({uuid: argv.uuid})
    if (!dataset) {
      throw new Error('Invalid uuid!')
    }

    var salesCenterExternalId = dataset.getSalesCenterColumn() || {name: ''}
    var salesCenterName = dataset.getSalesCenterNameColumn() || {name: ''}
    var productExternalId = dataset.getProductColumn() || {name: ''}
    var productName = dataset.getProductNameColumn() || {name: ''}
    var channelExternalId = dataset.getChannelColumn() || {name: ''}
    var channelName = dataset.getChannelNameColumn() || {name: ''}

    let productsObj = {
      _id: `$apiData.${productExternalId.name}`
    }

    if (productName.name) {
      productsObj['name'] = `$apiData.${productName.name}`
    }

    let salesCentersObj = {
      _id: `$apiData.${salesCenterExternalId.name}`
    }

    if (salesCenterName.name) {
      salesCentersObj['name'] = `$apiData.${salesCenterName.name}`
    }

    let channelsObj = {
      _id: `$apiData.${channelExternalId.name}`
    }

    if (channelName.name) {
      channelsObj['name'] = `$apiData.${channelName.name}`
    }

    let aux = {
      producto: productsObj,
      canal: channelsObj,
      ceves: salesCentersObj
    }

    var statement = [
      {
        '$match': {
          'dataset': dataset._id
        }
      },
      {
        '$group': {
          '_id': null,
          'neo': {
            '$addToSet': aux
          }
        }
      }
    ]
    const session = neo4j.session();
    const orgId = dataset.organization

    let rows = await DataSetRow.aggregate(statement)
    _.forEachPromise = function(rows) {
      return new Promise(function(complete, error) {
        _.forEach(rows, async function(value) {
          await CatalogItem.multiple(session, orgId, [{
            'label': 'Canal',
            'uuid': value.canal._id,
            'name': value.canal.name
          }, {
            'label': 'Agencia',
            'uuid': value.ceves._id,
            'name': value.ceves.name
          }, {
            'label': 'Producto',
            'uuid': value.producto._id,
            'name': value.producto.name
          }])
          await Organization.addRelationship(session, orgId, {
            'label': 'Canal',
            '_id': value.canal._id
          })
          complete('Graph created.')
        })
      })
    }

    await _.forEachPromise(rows[0].neo)
      .then(function(results) {
        console.log(results)
        session.close()
      })
      .catch(function(error) {
        console.log(error)
      })

    return true
  },
  async (argv) => {
    console.log('Creating graph of the dataset.')
  },
  async (argv) => {
    console.log('End of creation of the graph.')
  }
)

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
