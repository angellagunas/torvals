const Route = require('lib/router/route')
const {Organization, User, Role, Project} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/add/role',
  handler: async function (ctx) {
    const userId = ctx.params.uuid

    const user = await User.findOne({'uuid': userId})
    ctx.assert(user, 404, 'User not found')

    var roleData = ctx.request.body

    const org = await Organization.findOne({'uuid': roleData.organization})
    ctx.assert(org, 404, 'Organization not found')

    const role = await Role.findOne({'uuid': roleData.role})
    ctx.assert(role, 404, 'Role not found')

    if (roleData.project) {
      var project = await Project.findOne({'uuid': roleData.project})
      ctx.assert(project, 404, 'Project not found')
    }

    var pos = user.organizations.findIndex(e => {
      return (
        String(e.organization) === String(org._id)
      )
    })

    if (pos === -1) {
      ctx.throw(400, 'Invalid organization!')
    }

    user.organizations[pos] = {organization: org, role: role}

    if (project) {
      user.set({
        defaultProject: project
      })
    }

    user.save()

    ctx.body = {
      data: user.toAdmin()
    }
  }
})
