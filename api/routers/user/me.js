const Route = require('lib/router/route')
const {Organization, Role} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/me',
  handler: async function (ctx) {
    if (ctx.state.user) {
      const user = await ctx.state.user.toPublic()

      const data = {
        loggedIn: true,
        user
      }

      if (ctx.state.organization) {
        const currentOrganization = user.organizations.find(orgRel => {
          console.log('=>', ctx.state.organization._id.equals(orgRel.organization), orgRel.organization, ctx.state.organization.id)

          return ctx.state.organization._id.equals(orgRel.organization)
        })

        if (currentOrganization) {
          const org = await Organization.findOne({_id: currentOrganization.organization})
          const role = await Role.findOne({_id: currentOrganization.role})

          data.user.currentOrganization = org.toPublic()
          data.user.currentRole = role.toPublic()
        }
      }

      ctx.body = data
    } else {
      ctx.body = {
        loggedIn: false
      }
    }
  }
})
