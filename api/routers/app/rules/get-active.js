const Route = require('lib/router/route')

const {Rule} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/active',
  handler: async function (ctx) {
    const rule = await Rule.findOne({
      'isCurrent': true,
      'isDeleted': false,
      'organization': ctx.state.organization._id
    })

    ctx.assert(rule, 404, 'Reglas no encontradas')

    ctx.body = {
      data: rule.toPublic()
    }
  }
})
