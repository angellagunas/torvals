const Route = require('lib/router/route')

const {DataSet} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/deleted/:uuid',
  handler: async function (ctx) {
    var dataSetId = ctx.params.uuid

    var dataset = await DataSet.findOne({'uuid': dataSetId}).populate('project')
    ctx.assert(dataset, 404, 'DataSet not found')
    
    if (dataset.project.isDeleted === false) {
      dataset.project.datasets.push({dataset: dataset._id, columns: []})
      await dataset.project.save()
      dataset.set({isDeleted: false})
      await dataset.save()
    }
    else {
      ctx.throw(400, 'DataSet project is deleted')
    }

    ctx.body = {
      data: dataset
    }
  }
})
