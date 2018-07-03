const Route = require('lib/router/route')
const lov = require('lov')

const { Project, Role, User } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    name: lov.string().required(),
    email: lov.string().email().required()
  }),
  handler: async function (ctx) {
    let userId = ctx.params.uuid
    let data = ctx.request.body

    const user = await User.findOne({ 'uuid': userId })
    ctx.assert(user, 404, 'Usuario no encontrado')

    user.set({
      name: data.name,
      isAdmin: data.isAdmin
    })

    let org = user.organizations.find(e => {
      return String(e.organization) === String(ctx.state.organization._id)
    })
    if (data.project) {
      const project = await Project.findOne({'uuid': data.project})
      ctx.assert(project, 404, 'Proyecto no encontrado')
      org.defaultProject = project
    }

    const role = await Role.findOne({uuid: data.role })
    ctx.assert(user, 404, 'Role no encontrado')

    data.role = role._id
    org.role = role

    await org.save()
    await user.save()

    ctx.body = {
      data: user.toPublic()
    }
  }
})
