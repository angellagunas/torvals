const Route = require('lib/router/route')
const lov = require('lov')
const moment = require('moment')
const slugify = require('underscore.string/slugify')
const verifyPrices = require('queues/update-prices')
const generateCycles = require('tasks/organization/generate-cycles')

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
        data: auxOrg.toAdmin()
      }

      return
    }
    if (auxOrg && !auxOrg.isDeleted) {
      ctx.throw(400, 'No se pueden tener dos organizaciones con el mismo nombre')
    }

    const org = await Organization.create(
      {
        ...data,
        rules: {
          startDate: moment().startOf('year').utc().format('YYYY-MM-DD'),
          cycleDuration: 1,
          cycle: 'M',
          period: 'w',
          periodDuration: 1,
          season: 12,
          cyclesAvailable: 6,
          takeStart: true,
          consolidation: 30,
          forecastCreation: 12,
          rangeAdjustmentRequest: 24,
          rangeAdjustment: 18,
          salesUpload: 6,
          catalogs: ['Producto', 'Centro de venta', 'Canal']
        }
      })

    if (file) {
      await org.uploadOrganizationPicture(file)
    }

    verifyPrices.add({uuid: org.uuid})
    generateCycles.run({uuid: org.uuid})

    ctx.body = {
      data: org.toAdmin()
    }
  }
})
