const Route = require('lib/router/route')

const {RequestLog} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid',
  handler: async function (ctx) {
    var requestId = ctx.params.uuid

    const request = await RequestLog.findOne({'uuid': requestId})
    ctx.assert(request, 404, 'RequestLog no encontrado')

    ctx.body = {
      data: request
    }
  }
})
