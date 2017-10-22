const Route = require('lib/router/route')

module.exports = new Route({
  method: 'post',
  path: '/select/organization',
  handler: async function (ctx) {
    const { organization } = ctx.request.body
    ctx.state.user.set({selectedOrg: organization})
    await ctx.state.user.save()

    ctx.body = {
      organization: ctx.state.user.selectedOrg
    }
  }
})
