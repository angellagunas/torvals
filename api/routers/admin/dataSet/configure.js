const Route = require('lib/router/route')
const lov = require('lov')

const { DataSet } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/configure',
  handler: async function (ctx) {
    const body = ctx.request.body
    var datasetId = ctx.params.uuid
    const dataset = await DataSet.findOne({'uuid': datasetId, 'isDeleted': false})

    dataset.set({
      columns: body.columns,
      groupings: body.groupings,
      status: 'processing'
    })
    await dataset.save()

    /* setTimeout(() => {
      dataset.set({
        status: 'reviewing'
      })
      dataset.save()
    }, 60000) */

    ctx.body = {
      data: dataset
    }
  }
})
