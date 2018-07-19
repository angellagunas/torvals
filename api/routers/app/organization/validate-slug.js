const Route = require('lib/router/route')
const lov = require('lov')

const {Organization} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/validate',
  validator: lov.object().keys({
    slug: lov.string().required()
  }),
  handler: async function (ctx) {
    const { slug } = ctx.request.body
    const organization = await Organization.findOne({slug: slug})

    if (organization) {
      ctx.throw(400, 'Organization exists')
    }

    ctx.body = {
      status: 'OK'
    }
  }
})
