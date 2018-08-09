const Route = require('lib/router/route')
const lov = require('lov')
const crypto = require('crypto')

const { User, Role, Group, Project, Language } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    email: lov.string().email().required(),
    name: lov.string().required()
  }),
  handler: async function (ctx) {
    const userData = ctx.request.body

    if (!userData.password && !userData.sendInvite) {
      ctx.throw(400, 'Password o invitación requeridos')
    }

    if (!userData.password) {
      userData.password = crypto.randomBytes(15).toString('base64')
    }

    if (!userData.role) {
      let defaultRole = await Role.findOne({isDefault: true})
      if (!defaultRole) {
        defaultRole = await Role.create({
          name: 'Default',
          slug: 'default',
          description: 'Default role',
          isDefault: true
        })
      }

      userData.role = defaultRole
    }
    let orgObj = {
      organization: userData.organization,
      role: userData.role
    }

    if (userData.project) {
      const project = await Project.findOne({'uuid': userData.project})
      ctx.assert(project, 404, 'Proyecto no encontrado')
      orgObj.defaultProject = project
    }

    if (!userData.language) {
      const language = await Language.findOne({ code: 'es-MX' })
      userData.language = language
    }

    userData.organizations = [orgObj]

    const user = await User.register(userData)

    if (userData.group) {
      const group = await Group.findOne({'uuid': userData.group})
      ctx.assert(group, 404, 'Grupo no encontrado')

      if (user.groups.find(item => { return String(item) === String(group._id) })) {
        ctx.throw(400, 'Solamente puedes agregar el usuario al grupo una vez')
      }

      user.groups.push(group)
      group.users.push(user)
      await group.save()
    }

    await user.save()

    if (userData.sendInvite) {
      user.sendInviteEmail()
    }

    ctx.body = {
      data: user.toPublic()
    }
  }
})
