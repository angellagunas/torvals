const Route = require('lib/router/route')
const {Organization, User, Role, Project} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/add/organization',
  handler: async function (ctx) {
    const userId = ctx.params.uuid

    const user = await User.findOne({'uuid': userId})
    ctx.assert(user, 404, 'User not found')

    var orgData = ctx.request.body

    const org = await Organization.findOne({'uuid': orgData.organization})
    ctx.assert(org, 404, 'Organization not found')

    const role = await Role.findOne({'uuid': orgData.role})
    ctx.assert(org, 404, 'Role not found')

    var pos = user.organizations.findIndex(e => {
      return (
        String(e.organization) === String(org._id)
      )
    })

    if (pos >= 0) {
      ctx.throw(400, 'You cannot add another role to an organization!')
    }

    pos = user.organizations.findIndex(e => {
      return (
        String(e.organization) === String(org._id) &&
        String(e.role) === String(role._id)
      )
    })

    if (pos >= 0) {
      ctx.throw(400, 'You cannot add the same role and organization twice!')
    }

    let orgObj = {organization: org, role: role}

    if (orgData.project) {
      var project = await Project.findOne({'uuid': orgData.project})
      ctx.assert(project, 404, 'Project not found')
      orgObj.defaultProject = project
    }

    user.organizations.push(orgObj)

    user.save()

    ctx.body = {
      data: user.toAdmin()
    }
  }
})
