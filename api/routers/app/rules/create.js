const Route = require('lib/router/route')
const { Catalog, Organization, Period, Project, Rule} = require('models')
const moment = require('moment')
const slugify = require('underscore.string/slugify')
const generateCycles = require('tasks/organization/generate-cycles')

module.exports = new Route({
  method: 'post',
  path: '/',
  handler: async function (ctx) {
    let data = ctx.request.body
    let organizationId = ctx.state.organization._id

    const org = await Organization.findOne({'_id': organizationId, 'isDeleted': false})
    ctx.assert(org, 404, 'Organización no encontrada')

    if (isNaN(data.cycleDuration) || data.cycleDuration <= 0) { ctx.throw(422, 'La duración del ciclo debe de ser numérico y mayor a 0') }
    if (isNaN(data.periodDuration) || data.periodDuration <= 0) { ctx.throw(422, 'La duración del period debe de ser numérico y mayor a 0') }
    if (isNaN(data.season) || data.season <= 0) { ctx.throw(422, 'La duración de la temporada debe de ser numérico y mayor a 0') }
    if (!data.cycle) { ctx.throw(422, 'El ciclo es un dato requerido') }

    data.cycle = (data.cycle === 'm') ? 'M' : data.cycle
    data.period = (data.period === 'm') ? 'M' : data.period

    if (data.cycle !== 'M' && data.cycle !== 'd' && data.cycle !== 'y' && data.cycle !== 'w') { ctx.throw(422, 'Valor incorrecto para el ciclo') }

    let startDate = moment(data.startDate).utc().format('YYYY-MM-DD')
    let cycleDate = moment(startDate).utc().add(data.cycleDuration, data.cycle)
    let periodDate = moment(startDate).utc().add(data.periodDuration, data.period)
    let cycleDiff = moment.duration(cycleDate.diff(startDate)).asDays()
    let periodDiff = moment.duration(periodDate.diff(startDate)).asDays()

    if (cycleDiff < periodDiff) { ctx.throw(400, 'El ciclo no puede tener menor duración que el periodo') }

    if (data.periodDuration <= 0 || data.cyclesDuration <= 0) {
      ctx.throw(400, 'Las duraciones del periodo y el ciclo tienen que ser mayores a 0')
    }

    if (!Array.isArray(data.ranges)) { ctx.throw(422, 'Rangos tiene tipo inválido') }
    let validRanges = data.ranges.every(item => {
      return (typeof item === 'number' && item >= 0) || item === null
    })

    if (!validRanges) { ctx.throw(422, 'El valor de los rangos debe de ser númerico y mayor a 0') }

    if (isNaN(data.consolidation) || data.consolidation <= 0) { ctx.throw(422, 'El valor de consolidar debe de ser númerico y mayor a 0') }
    if (isNaN(data.forecastCreation) || data.forecastCreation <= 0) { ctx.throw(422, 'El valor de forecast debe de ser númerico y mayor a 0') }
    if (isNaN(data.rangeAdjustmentRequest) || data.rangeAdjustmentRequest <= 0) { ctx.throw(422, 'El valor de ajuste debe de ser númerico y mayor a 0') }
    if (isNaN(data.rangeAdjustment) || data.rangeAdjustment <= 0) { ctx.throw(422, 'El valor de aprobación debe de ser númerico y mayor a 0') }
    if (isNaN(data.salesUpload) || data.salesUpload <= 0) { ctx.throw(422, 'El valor de ventas debe de ser númerico y mayor a 0') }

    if (!Array.isArray(data.catalogs)) { ctx.throw(422, 'Catálogos tiene tipo inválido') }

    let findProductsCatalog = data.catalogs.find(item => { return item.slug === 'producto' || item.slug === 'productos' })
    if (findProductsCatalog === undefined) { ctx.throw(422, 'Se debe de agregar un catálogo de productos') }

    let catalogsData = []
    for (catalog of data.catalogs) {
      let catalogObj = await Catalog.create({
        type: catalog.slug,
        name: catalog.name,
        slug: catalog.slug,
        organization: organizationId,
        isDeleted: false
      })
      catalogsData.push(catalogObj._id)
    }
    data.catalogs = catalogsData

    let previousRule = await Rule.findOne({isCurrent: true, organization: organizationId})

    let version = (previousRule) ? previousRule.version + 1 : 1

    await Rule.update({organization: organizationId}, {isCurrent: false}, {multi: true})

    data._id = undefined
    data.uuid = undefined
    data.isDeleted = undefined

    let rule = await Rule.create({
      ...data,
      organization: organizationId,
      isCurrent: true,
      version: version
    })

    await generateCycles.run({uuid: org.uuid, rule: rule.uuid})

    const periods = await Period.find({ organization: org._id, isDeleted: false, rule: rule._id }).populate('cycle')
    let periodsArray = new Set()
    let cyclesArray = new Set()
    periods.data = periods.map(item => {
      periodsArray.add(item._id)
      cyclesArray.add(item.cycle._id)
      return item.toPublic()
    })

    rule.set({
      periods: Array.from(periodsArray),
      cycles: Array.from(cyclesArray)
    })

    await rule.save()

    rule = await Rule.findOne({_id: rule._id}).populate('catalogs')

    await Project.update({organization: org._id}, {outdated: true}, {multi: true})

    ctx.body = {
      rules: rule,
      periods: periods.data
    }
  }
})
