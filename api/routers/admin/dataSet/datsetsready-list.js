const Route = require('lib/router/route')
const { DataSet } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/readylist',
  handler: async function (ctx) {
    var datasets = await DataSet.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: {isDeleted: false, status: 'ready'},
      sort: '-dateCreated',
      populate: 'organization'
    })

    ctx.body = datasets
  }
})
