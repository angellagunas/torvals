const Route = require('lib/router/route')
const moment = require('moment')
const generateCycles = require('tasks/organization/generate-cycles')

const {Organization, Period} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/rules/:uuid',
  handler: async function (ctx) {
    var organizationId = ctx.params.uuid
    const data = ctx.request.body

    if (organizationId !== ctx.state.organization.uuid) {
      ctx.throw(404, 'Organización no encontrada')
    }

    const org = await Organization.findOne({'uuid': organizationId, 'isDeleted': false})
    ctx.assert(org, 404, 'Organización no encontrada')

    if (!data.step) { data.step = 1 }

    if (data.step === 1) {
      if (isNaN(data.cycleDuration) || data.cycleDuration <= 0) { ctx.throw(422, 'La duración del ciclo debe de ser numérico y mayor a 0') }
      if (isNaN(data.periodDuration) || data.periodDuration <= 0) { ctx.throw(422, 'La duración del period debe de ser numérico y mayor a 0') }
      if (isNaN(data.season) || data.season <= 0) { ctx.throw(422, 'La duración de la temporada debe de ser numérico y mayor a 0') }
      if (!data.cycle) { ctx.throw(422, 'El ciclo es un dato requerido') }

      data.cycle = (data.cycle === 'm') ? 'M' : data.cycle
      data.period = (data.period === 'm') ? 'M' : data.period

      if (data.cycle !== 'M' && data.cycle !== 'd' && data.cycle !== 'y' && data.cycle !== 'w') { ctx.throw(422, 'Valor incorrecto para el ciclo') }

      var startDate = moment(data.startDate).utc().format('YYYY-MM-DD')
      var cycleDate = moment(startDate).utc().add(data.cycleDuration, data.cycle)
      var periodDate = moment(startDate).utc().add(data.periodDuration, data.period)
      var cycleDiff = moment.duration(cycleDate.diff(startDate)).asDays()
      var periodDiff = moment.duration(periodDate.diff(startDate)).asDays()

      if (cycleDiff < periodDiff) { ctx.throw(400, 'El ciclo no puede tener menor duración que el periodo') }

      if (data.periodDuration <= 0 || data.cyclesDuration <= 0) {
        ctx.throw(400, 'Las duraciones del periodo y el ciclo tienen que ser mayores a 0')
      }

      org.set({
        rules: {
          startDate: data.startDate,
          cycleDuration: data.cycleDuration,
          cycle: data.cycle,
          period: data.period,
          periodDuration: data.periodDuration,
          season: data.season,
          cyclesAvailable: data.cyclesAvailable,
          takeStart: data.takeStart
        }
      })
    }

    if (data.step === 2) {
      if (!Array.isArray(data.ranges)) { ctx.throw(422, 'Rangos tiene tipo inválido') }
      let validRanges = data.ranges.every(item => {
        return (typeof item === 'number' && item >= 0) || item === null
      })

      if (!validRanges) { ctx.throw(422, 'El valor de los rangos debe de ser númerico y mayor a 0') }

      org.set({
        rules: {
          ranges: data.ranges
        }
      })
    }

    if (data.step === 3) {
      if (isNaN(data.consolidation) || data.consolidation <= 0) { ctx.throw(422, 'El valor de consolidar debe de ser númerico y mayor a 0') }
      if (isNaN(data.forecastCreation) || data.forecastCreation <= 0) { ctx.throw(422, 'El valor de forecast debe de ser númerico y mayor a 0') }
      if (isNaN(data.rangeAdjustmentRequest) || data.rangeAdjustmentRequest <= 0) { ctx.throw(422, 'El valor de ajuste debe de ser númerico y mayor a 0') }
      if (isNaN(data.rangeAdjustmentRequest) || data.rangeAdjustmentRequest <= 0) { ctx.throw(422, 'El valor de aprobación debe de ser númerico y mayor a 0') }
      if (isNaN(data.salesUpload) || data.salesUpload <= 0) { ctx.throw(422, 'El valor de ventas debe de ser númerico y mayor a 0') }

      org.set({
        rules: {
          consolidation: data.consolidation,
          forecastCreation: data.forecastCreation,
          rangeAdjustmentRequest: data.rangeAdjustmentRequest,
          rangeAdjustment: data.rangeAdjustment,
          salesUpload: data.salesUpload
        }
      })
    }

    if (data.step === 4) {
      if (!Array.isArray(data.catalogs)) { ctx.throw(422, 'Catálogos tiene tipo inválido') }

      let findProductsCatalog = data.catalogs.find(item => { return item === 'producto' })
      if (findProductsCatalog === undefined) { ctx.throw(422, 'Se debe de agregar un catálogo de productos') }

      org.set({
        rules: {
          catalogs: data.catalogs
        }
      })
    }

    await org.save()

    if (data.step === 1) {
      await generateCycles.run({uuid: org.uuid})
    }

    const periods = await Period.find({ organization: org._id, isDeleted: false }).populate('cycle')
    periods.data = periods.map(item => {
      return item.toPublic()
    })

    ctx.body = {
      data: { ...org.toPublic(),
        periods: periods.data
      }
    }
  }
})
