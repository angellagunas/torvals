const Route = require('lib/router/route')
const lov = require('lov')
const moment = require('moment')
const slugify = require('underscore.string/slugify')
const verifyPrices = require('queues/update-prices')
const generateCycles = require('tasks/organization/generate-cycles')

const {Organization, Rule} = require('models')

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
        data
      })

    const rule = await Rule.create(
      {
        startDate: moment().startOf('year').utc().format('YYYY-MM-DD'),
        cycleDuration: 1,
        cycle: 'M',
        period: 'w',
        periodDuration: 1,
        season: 12,
        cyclesAvailable: 6,
        takeStart: true,
        consolidation: 8,
        forecastCreation: 3,
        rangeAdjustmentRequest: 6,
        rangeAdjustment: 10,
        salesUpload: 3,
        catalogs: [
          {
            name: 'Producto',
            slug: 'producto'
          }, {
            name: 'Centro de venta',
            slug: 'centro-de-venta'
          }, {
            name: 'Canal',
            slug: 'canal'
          }
        ],
        ranges: [0, 0, 10, 20, 30, null],
        version: 1,
        organization: org._id
      })

    org.set({
      rule: rule._id
    })
    await org.save()

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
