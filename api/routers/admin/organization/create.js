const Route = require('lib/router/route')
const lov = require('lov')
const slugify = require('underscore.string/slugify')

const {Organization} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    name: lov.string().required()
  }),
  handler: async function (ctx) {
    var data = ctx.request.body

    data.slug = slugify(data.name)
    const auxOrg = await Organization.findOne({slug: data.slug})
    console.log(auxOrg)
    if (auxOrg && !auxOrg.isDeleted) {
      ctx.throw(400, "You can't have two organizations with the same name")
    }

    if (auxOrg && auxOrg.isDeleted) {
      auxOrg.isDeleted = false
      auxOrg.save()

      ctx.body = {
        data: auxOrg.format()
      }

      return
    }

    const org = await Organization.create(data)

    ctx.body = {
      data: org.format()
    }
  }
})
