const Route = require('lib/router/route')
const { Alert } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
    const labels = await Alert.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: {
        isDeleted: false
      },
      sort: ctx.request.query.sort || 'dateCreated'
    })

    ctx.body = labels
  }
})
