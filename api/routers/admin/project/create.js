const Route = require('lib/router/route')
const lov = require('lov')

const { Project, Organization } = require('models')
const Api = require('lib/abraxas/api')
const request = require('lib/request')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    name: lov.string().required(),
    organization: lov.string().required(),
    adjustment: lov.string()
  }),
  handler: async function (ctx) {
    var data = ctx.request.body
    const org = await Organization.findOne({uuid: data.organization})

    if (!org) {
      ctx.throw(404, 'Organización no encontrada')
    }

    const project = await Project.create({
      name: data.name,
      description: data.description,
      organization: org._id,
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
        externalId: res._id,
        etag: res._etag
      })

      await project.save()
    } catch (e) {
      await project.remove()
      let errorString = []
      errorString = /<title>(.*?)<\/title>/g.exec(e.message)
      ctx.throw(503, 'Abraxas API: ' + (errorString[1] || 'No está disponible'))

      return false
    }

    ctx.body = {
      data: project
    }
  }
})
