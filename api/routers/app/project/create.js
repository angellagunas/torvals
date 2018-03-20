const Route = require('lib/router/route')
const lov = require('lov')

const { Project } = require('models')
const Api = require('lib/abraxas/api')
const request = require('lib/request')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    name: lov.string().required(),
    adjustment: lov.string()
  }),
  handler: async function (ctx) {
    var data = ctx.request.body

    const project = await Project.create({
      name: data.name,
      description: data.description,
      organization: ctx.state.organization._id,
      adjustment: data.adjustment,
      createdBy: ctx.state.user
    })

    try {
      var apiData = Api.get()
      if (!apiData.token) {
        await Api.fetch()
        apiData = Api.get()
      }
    } catch (e) {
      await project.remove()
      ctx.throw(503, 'Abraxas API no disponible para la conexión')
    }

    var options = {
      url: `${apiData.hostname}${apiData.baseUrl}/projects`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiData.token}`
      },
      body: {
        uuid: project.uuid
      },
      json: true,
      persist: true
    }

    try {
      var res = await request(options)

      project.set({
        externalId: res._id
      })

      await project.save()
    } catch (e) {
      await project.remove()
      let errorString = /<title>(.*?)<\/title>/g.exec(e.message)
      if (!errorString) {
        errorString = []
        errorString[1] = e.message
      }
      ctx.throw(503, 'Abraxas API: ' + errorString[1])

      return false
    }

    ctx.body = {
      data: project
    }
  }
})
