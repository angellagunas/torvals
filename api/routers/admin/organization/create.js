const Route = require('lib/router/route')
const lov = require('lov')
const moment = require('moment')
const slugify = require('underscore.string/slugify')
const verifyPrices = require('queues/update-prices')
const generateCycles = require('tasks/organization/generate-cycles')

const {Organization, Rule, Catalog} = require('models')

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

    let defaultRule = {
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
      ranges: [0, 0, 10, 20, 30, null],
      rangesLvl2: [0, 0, 10, 20, 30, null],
      version: 1
    }

    if (auxOrg && auxOrg.isDeleted) {
      auxOrg.set({
        name: data.name,
        isDeleted: false,
        isConfigured: false
      })
      await auxOrg.save()

      let catalogs = []

      for (let cat of ['Producto', 'Centro de venta', 'Canal']) {
        let auxCatalog = await Catalog.create({
          name: cat,
          slug: slugify(cat),
          organization: auxOrg
        })
        catalogs.push(auxCatalog)
      }

      await Rule.update(
        {organization: auxOrg},
        {isCurrent: false},
        {multi: true}
      )

      const rule = await Rule.create({
        ...defaultRule,
        catalogs: catalogs,
        organization: auxOrg._id
      })

      auxOrg.set({
        rule: rule._id
      })
      await auxOrg.save()

      ctx.body = {
        data: auxOrg.toAdmin()
      }

      return
    }
    if (auxOrg && !auxOrg.isDeleted) {
      ctx.throw(400, 'No se pueden tener dos organizaciones con el mismo nombre')
    }

    const org = await Organization.create(data)

    let catalogs = []

    for (let cat of ['Producto', 'Centro de venta', 'Canal']) {
      let auxCatalog = await Catalog.create({
        name: cat,
        slug: slugify(cat),
        organization: org._id
      })
      catalogs.push(auxCatalog)
    }

    const rule = await Rule.create({
      ...defaultRule,
      catalogs: catalogs,
      organization: org._id
    })

    org.set({
      rule: rule._id
    })
    await org.save()

    if (file) {
      await org.uploadOrganizationPicture(file)
    }

    // verifyPrices.add({uuid: org.uuid})
    generateCycles.run({uuid: org.uuid})

    ctx.body = {
      data: org.toAdmin()
    }
  }
})
