const Route = require('lib/router/route')

const {Rule} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid',
  handler: async function (ctx) {
    let ruleId = ctx.params.uuid

    const rule = await Rule.findOne({
      'uuid': ruleId,
      'isDeleted': false,
      'organization': ctx.state.organization._id
    })
    .populate('organization')
    ctx.assert(rule, 404, 'Reglas no encontradas')

    ctx.body = {
      data: rule.toPublic()
    }
  }
})
