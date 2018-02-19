const Route = require('lib/router/route')
const lov = require('lov')

const {User, Project} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    name: lov.string().required(),
    email: lov.string().email().required()
  }),
  handler: async function (ctx) {
    var userId = ctx.params.uuid
    var data = ctx.request.body

    const user = await User.findOne({'uuid': userId})
    ctx.assert(user, 404, 'User not found')

    user.set({name: data.name, isAdmin: data.isAdmin})

    var org = user.organizations.find(e => {
      return String(e.organization) === String(ctx.state.organization._id)
    })

    if (data.project) {
      const project = await Project.findOne({'uuid': data.project})
      ctx.assert(project, 404, 'Project not found')
      org.defaultProject = project
    }

    org.role = data.role
    ctx.body = {
      data: user.format()
    }
  }
})
