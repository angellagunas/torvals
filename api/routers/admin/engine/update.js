const Route = require('lib/router/route')
const {Engine} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  handler: async function (ctx) {
    const uuid = ctx.params.uuid
    const data = ctx.request.body
    const engine = await Engine.findOne({uuid: uuid, isDeleted: false})
    ctx.assert(engine, 404, 'Engine no encontrado')

    engine.set({
      description: data.description
    })

    await engine.save()

    ctx.body = engine.toPublic()
  }
})
