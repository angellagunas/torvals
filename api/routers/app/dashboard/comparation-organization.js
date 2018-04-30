const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')
const Api = require('lib/abraxas/api')

const { Project } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/comparation/organization',
  handler: async function (ctx) {
    var data = ctx.request.body

    const requestBody = {
      date_start: data.date_start,
      date_end: data.date_end
    }

    var responseData = await Api.comparationOrganization(ctx.state.organization.uuid, requestBody)

    ctx.body = responseData
  }
})
