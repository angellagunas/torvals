const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')
const Api = require('lib/abraxas/api')

const { Project } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/graphic/projects/:uuid',
  handler: async function (ctx) {
    const uuid = ctx.params.uuid
    var data = ctx.request.body

    const project = await Project.findOne({'uuid': uuid})
    ctx.assert(project, 404, 'Proyecto no encontrado')

    const requestBody = {
      date_start: data.date_start,
      date_end: data.date_end
    }

    var responseData = await Api.graphicProject(project.externalId, requestBody)

    ctx.body = responseData
  }
})
