const Route = require('lib/router/route')
const { Label } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/',
  handler: async function (ctx) {
    const data = ctx.request.body.updatedLabels
    console.log(data)
    const user = ctx.state.user
    let currentOrganization
    if (ctx.state.organization) {
      currentOrganization = user.organizations.find(orgRel => {
        return ctx.state.organization._id.equals(orgRel.organization._id)
      })
    }
    ctx.assert(currentOrganization, 404, 'Organización no encontrada')

    for (let label of data) {
      const labelObj = await Label.findOne({
        uuid: label.uuid
      })
      if (!label) {
        continue
      }

      labelObj.set({
        text: label.newLabel
      })
      labelObj.save()
    }

    ctx.body = {
      success: 'ok'
    }
  }
})
