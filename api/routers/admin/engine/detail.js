const Route = require('lib/router/route')
const {Engine} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid',
  handler: async function (ctx) {
    const uuid = ctx.params.uuid
    const engine = await Engine.findOne({uuid: uuid, isDeleted: false})
    ctx.assert(engine, 404, 'Engine no encontrado')
    ctx.body = engine.toPublic()
  }
})
