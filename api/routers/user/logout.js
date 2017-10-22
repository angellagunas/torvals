const Route = require('lib/router/route')

module.exports = new Route({
  method: 'get',
  path: '/logout',
  handler: async function (ctx) {
    ctx.state.user.set({selectedOrg: null})
    await ctx.state.user.save()

    ctx.body = {
      data: 'OK'
    }
  }
})
