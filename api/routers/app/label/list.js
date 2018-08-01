const Route = require('lib/router/route')
const { Label, Language } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
    const user = ctx.state.user
    let currentOrganization
    if (ctx.state.organization) {
      currentOrganization = user.organizations.find(orgRel => {
        return ctx.state.organization._id.equals(orgRel.organization._id)
      })
    }
    ctx.assert(currentOrganization, 404, 'Organización no encontrada')


    const language = await Language.findOne({
      'code': ctx.request.query.language || 'es-MX'
    })
    ctx.assert(language, 404, 'Idioma no encontrado')

    let filters = {}
    filters['organization'] = currentOrganization.organization._id
    filters['language'] = language._id

    const labels = await Label.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: {
        isDeleted: false,
        ...filters
      },
      sort: ctx.request.query.sort || 'dateCreated'
    })

    ctx.body = labels
  }
})
