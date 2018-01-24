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
      ctx.throw(404, 'Organization not found')
    }

    const project = await Project.create({
      name: data.name,
      description: data.description,
      organization: org._id,
      adjustment: data.adjustment
    })

    var apiData = Api.get()
    if (!apiData.token) {
      await Api.fetch()
      apiData = Api.get()
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
      project.remove()
      ctx.throw(401, 'Failed to send Dataset for conciliation')
    }

    ctx.body = {
      data: project
    }
  }
})
