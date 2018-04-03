const Route = require('lib/router/route')
const lov = require('lov')

const { Channel } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/approve',
  validator: lov.array().items([
    lov.object().keys({
      uuid: lov.string().required()
    }).required()
  ]),
  handler: async function (ctx) {
    var data = ctx.request.body
    let successCounter = 0
    let errorCounter = 0
    let errorArray = []

    for (let item of data) {
      const channel = await Channel.findOne({
        'uuid': item.uuid,
        'isDeleted': false
      })

      if (!channel) {
        errorCounter += 1
        errorArray.push(item)
      } else {
        channel.set({
          isNewExternal: false
        })

        await channel.save()
        successCounter += 1
      }
    }

    ctx.body = {
      success: successCounter,
      error: errorCounter,
      errorArray
    }
  }
})
