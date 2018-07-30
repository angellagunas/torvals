const Route = require('lib/router/route')
const { Label, Language } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/default',
  handler: async function (ctx) {
    let filters = {}
    const language = await Language.findOne({
      'code': ctx.request.query.language || 'es-MX'
    })
    ctx.assert(language, 404, 'Idioma no encontrado')

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
