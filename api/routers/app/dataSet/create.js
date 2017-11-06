const Route = require('lib/router/route')
const lov = require('lov')

const {DataSet} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    name: lov.string().required(),
    description: lov.string()
  }),
  handler: async function (ctx) {
    const body = ctx.request.body

    const dataset = await DataSet.create({
      name: body.name,
      description: body.description,
      organization: ctx.state.organization._id
    })

    ctx.body = {
      data: dataset
    }
  }
})
