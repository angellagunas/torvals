const Route = require('lib/router/route')
const lov = require('lov')
const moment = require('moment')
const generateCycles = require('tasks/organization/generate-cycles')

const {Organization, Period} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/rules/:uuid',
  validator: lov.array().items([
    lov.object().keys({
      cycle: lov.string().required(),
      cycleDuration: lov.number().required(),
      startDate: lov.string().required(),
      cyclesAvailable: lov.string().required(),
      period: lov.string().required(),
      periodDuration: lov.string().required(),
      season: lov.string().required()
    }).required()
  ]),
  handler: async function (ctx) {
    var organizationId = ctx.params.uuid
    const data = ctx.request.body

    /* if (organizationId !== ctx.state.organization.uuid) {
      ctx.throw(404, 'Organización no encontrada')
    } */

    const org = await Organization.findOne({'uuid': organizationId, 'isDeleted': false})
    ctx.assert(org, 404, 'Organización no encontrada')

    if (data.step === 1) {
      data.cycle = (data.cycle === 'm') ? 'M' : data.cycle
      data.period = (data.period === 'm') ? 'M' : data.period

      var startDate = moment(data.startDate).format('YYYY-MM-DD')

      var cycleDate = moment(startDate).add(data.cycleDuration, data.cycle)
      var periodDate = moment(startDate).add(data.periodDuration, data.period)

      var cycleDiff = moment.duration(cycleDate.diff(startDate)).asDays()
      var periodDiff = moment.duration(periodDate.diff(startDate)).asDays()

      if (cycleDiff < periodDiff) { ctx.throw(400, 'El ciclo no puede tener menor duración que el periodo') }

      if (data.periodDuration <= 0 || data.cyclesDuration <= 0) {
        ctx.throw(400, 'Las duraciones del periodo y el ciclo tienen que ser mayores a 0')
      }
    }

    org.set({
      rules: {
        startDate: data.startDate || null,
        cycleDuration: data.cycleDuration || null,
        cycle: data.cycle || null,
        period: data.period || null,
        periodDuration: data.periodDuration || null,
        season: data.season || null,
        cyclesAvailable: data.cyclesAvailable || null,
        takeStart: data.takeStart || null,
        consolidation: data.consolidation || null,
        forecastCreation: data.forecast_creation || null,
        rangeAdjustmentRequest: data.range_adjustmentRequest || null,
        salesUpload: data.sales_upload || null,
        ranges: data.ranges || null
      }
    })

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
