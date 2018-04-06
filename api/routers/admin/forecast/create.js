const Route = require('lib/router/route')
const lov = require('lov')

const {Forecast} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    dateStart: lov.date().required(),
    dateEnd: lov.date().required()
  }),
  handler: async function (ctx) {
    var data = ctx.request.body

    const forecast = await Forecast.create(data)

    ctx.body = {
      data: forecast.toAdmin()
    }
  }
})
