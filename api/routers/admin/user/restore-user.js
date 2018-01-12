const Route = require('lib/router/route')

const {User} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/deleted/:uuid',
  handler: async function (ctx) {
    var userId = ctx.params.uuid

    var user = await User.findOne({'uuid': userId})
    ctx.assert(user, 404, 'User not found')

    user.set({isDeleted: false})
    user.save()

    ctx.body = {
      data: user
    }
  }
})
