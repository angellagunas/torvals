const Route = require('lib/router/route')
const lov = require('lov')
const slugify = require('underscore.string/slugify')
const verifyPrices = require('queues/update-prices')

const {Organization} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    name: lov.string().required()
  }),
  handler: async function (ctx) {
    var data = ctx.request.body
    var file = data.profile

    data.slug = slugify(data.name)
    const auxOrg = await Organization.findOne({slug: data.slug})

    if (auxOrg && auxOrg.isDeleted) {
      auxOrg.isDeleted = false
      auxOrg.save()

      ctx.body = {
        data: auxOrg.format()
      }

      return
    }
    if (auxOrg && !auxOrg.isDeleted) {
      ctx.throw(400, 'No se pueden tener dos organizaciones con el mismo nombre')
    }

    const org = await Organization.create(data)

    if (file) {
      await org.uploadOrganizationPicture(file)
    }

    verifyPrices.add({uuid: org.uuid})

    ctx.body = {
      data: org.toAdmin()
    }
  }
})
