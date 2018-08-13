const Route = require('lib/router/route')
const lov = require('lov')
const moment = require('moment')
const slugify = require('underscore.string/slugify')
const generateCycles = require('tasks/organization/generate-cycles')

const {Organization, Catalog, Rule, User, Role} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/validate',
  validator: lov.object().keys({
    slug: lov.string().required(),
    user: lov.string().required()
  }),
  handler: async function (ctx) {
    const slug = slugify(ctx.request.body.slug)
    const userId = ctx.request.body.user
    const organization = await Organization.findOne({slug: slug})
    const user = await User.findOne({uuid: userId})
    ctx.assert(user, 400, 'Usuario no existe.')

    if (organization) {
      ctx.throw(400, 'Organización ya existe.')
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
      slug: slug,
      accountOwner: user._id
    })

    let role = await Role.findOne({slug: 'orgadmin'})

    var organizations = [{organization: org, role: role}]

    user.set({
      organizations
    })

    await user.save()

    let userData = user.toPublic()
    userData.currentOrganization = org.toPublic()
    userData.currentRole = role.toPublic()

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
      data: org.toPublic(),
      user: userData
    }
  }
})
