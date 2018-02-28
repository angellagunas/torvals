const Route = require('lib/router/route')
const {Organization, User, Role, Project} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/add/organization',
  handler: async function (ctx) {
    const userId = ctx.params.uuid

    const user = await User.findOne({'uuid': userId})
    ctx.assert(user, 404, 'Usuario no encontrado')

    var orgData = ctx.request.body

    const org = await Organization.findOne({'uuid': orgData.organization})
    ctx.assert(org, 404, 'Organización no encontrada')

    const role = await Role.findOne({'uuid': orgData.role})
    ctx.assert(role, 404, 'Rol no encontrado')

    var pos = user.organizations.findIndex(e => {
      return (
        String(e.organization) === String(org._id)
      )
    })

    if (pos >= 0) {
      ctx.throw(400, 'No puedes agregar otro rol a la organización')
    }

    pos = user.organizations.findIndex(e => {
      return (
        String(e.organization) === String(org._id) &&
        String(e.role) === String(role._id)
      )
    })

    if (pos >= 0) {
      ctx.throw(400, 'No puedes agregar el mismo rol y organización nuevamente')
    }

    let orgObj = {organization: org, role: role}

    if (orgData.project) {
      var project = await Project.findOne({'uuid': orgData.project})
      ctx.assert(project, 404, 'Proyecto no encontrado')
      orgObj.defaultProject = project
    }

    user.organizations.push(orgObj)

    await user.save()

    ctx.body = {
      data: user.toAdmin()
    }
  }
})
