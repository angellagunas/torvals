const Route = require('lib/router/route')

const {User} = require('models')

module.exports = new Route({
  method: 'delete',
  path: '/:uuid',
  handler: async function (ctx) {
    var userId = ctx.params.uuid

    var user = await User.findOne({'uuid': userId}).populate('groups')
    ctx.assert(user, 404, 'User not found')

    user.set({
      isDeleted: true
    })

    for (var group of user.groups) {
      var pos = group.users.indexOf(user._id)
      group.users.splice(pos, 1)
      group.save()
    }

    user.set({
      groups: []
    })

    await user.save()

    ctx.body = {
      data: user.toPublic()
    }
  }
})
