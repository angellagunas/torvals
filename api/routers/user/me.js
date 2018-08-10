const Route = require('lib/router/route')
const {Organization, Role, Project, Rule} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/me',
  handler: async function (ctx) {
    if (ctx.state.user) {
      await ctx.state.user.populate('language').execPopulate()
      let user = ctx.state.user.toPublic()
      user.language = ctx.state.user.language ? ctx.state.user.language.uuid : undefined
      user.languageCode = ctx.state.user.language ? ctx.state.user.language.code : undefined

      const data = {
        loggedIn: true,
        user
      }

      if (ctx.state.organization) {
        const currentOrganization = user.organizations.find(orgRel => {
          return ctx.state.organization._id.equals(orgRel.organization._id)
        })

        if (currentOrganization) {
          const org = await Organization.findOne({_id: currentOrganization.organization}).populate('accountOwner')
          const role = await Role.findOne({_id: currentOrganization.role})
          const rule = await Rule.findOne({
            organization: org._id,
            isCurrent: true
          }).populate('catalogs')

          data.user.currentOrganization = org.toPublic()
          data.user.currentRole = role.toPublic()
          data.rule = rule.toPublic()

          if (role.slug === 'manager-level-1') {
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
