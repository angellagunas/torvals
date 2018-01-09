const Route = require('lib/router/route')
const lov = require('lov')
const crypto = require('crypto')

const {User, Role, Group} = require('models')

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
      ctx.throw(400, 'Password or Invite required!')
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

    userData.organizations = [{
      organization: userData.organization,
      role: userData.role
    }]

    const user = await User.register(userData)

    if (userData.group) {
      const group = await Group.findOne({'uuid': userData.group})
      ctx.assert(group, 404, 'Group not found')

      if (user.groups.find(item => { return String(item) === String(group._id) })) {
        ctx.throw(400, 'You can only add the user to a group once!')
      }

      user.groups.push(group)
    }

    await user.save()

    if (userData.sendInvite) {
      user.sendInviteEmail()
    }

    ctx.body = {
      data: user.format()
    }
  }
})
