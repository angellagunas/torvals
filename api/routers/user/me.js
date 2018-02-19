const Route = require('lib/router/route')
const {Organization, Role, Project} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/me',
  handler: async function (ctx) {
    if (ctx.state.user) {
      const user = ctx.state.user.toPublic()

      const data = {
        loggedIn: true,
        user
      }

      if (ctx.state.organization) {
        const currentOrganization = user.organizations.find(orgRel => {
          return ctx.state.organization._id.equals(orgRel.organization._id)
        })

        if (currentOrganization) {
          const org = await Organization.findOne({_id: currentOrganization.organization})
          const role = await Role.findOne({_id: currentOrganization.role})

          data.user.currentOrganization = org.toPublic()
          data.user.currentRole = role.toPublic()

          if (role.slug === 'localmanager') {
            data.user.currentProject = await Project.findOne({_id: currentOrganization.defaultProject})
          }
        }
      }

      user.organizations = user.organizations.map(item => {
        return {
          organization: item.organization.toPublic(),
          role: item.role.toPublic()
        }
      })

      ctx.body = data
    } else {
      ctx.body = {
        loggedIn: false
      }
    }
  }
})
