const Route = require('lib/router/route')
const lov = require('lov')
const moment = require('moment')
const slugify = require('underscore.string/slugify')
const generateCycles = require('tasks/organization/generate-cycles')

const {Organization, Catalog, Rule} = require('models')

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

    const org = await Organization.create({
      slug: slug
    })

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

    generateCycles.run({uuid: org.uuid, rule: rule.uuid})

    ctx.body = {
      data: org.toPublic()
    }
  }
})
