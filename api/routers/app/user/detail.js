const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')
const {User, Organization} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid',
  handler: async function (ctx) {
    const userId = ctx.params.uuid

    let user = await User.findOne({'uuid': userId})
      .populate('organizations.organization')
      .populate('organizations.role')
      .populate('organizations.defaultProject')
      .populate('groups')

    ctx.assert(user, 404, 'Usuario no encontrado')

    user = user.toPublic()
    user.role = user.organizations.find(e => {
      return e.organization.uuid === ctx.state.organization.uuid
    }).role.uuid
    user.roleDetail = user.organizations.find(e => {
      return e.organization.uuid === ctx.state.organization.uuid
    }).role
    let auxGroups = []
    let groups = user.groups

    for (let group of groups) {
      if (!group.organization.uuid) {
        group.organization = await Organization.findOne({'_id': ObjectId(group.organization)})
      }

      if (group.organization.uuid === ctx.state.organization.uuid) auxGroups.push(group)
    }

    user.groups = auxGroups

    ctx.body = {
      data: user
    }
  }
})