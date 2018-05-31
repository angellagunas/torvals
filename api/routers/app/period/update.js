const Route = require('lib/router/route')
const moment = require('moment')
const { Period, Cycle } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  handler: async function (ctx) {
    var periodUuid = ctx.params.uuid
    var data = ctx.request.body

    const period = await Period.findOne({uuid: periodUuid, isDeleted: false}).populate('organization cycle')

    ctx.assert(period, 404, 'Periodo no encontrado')
    var startDate = moment(data.startDate).utc().format('YYYY-MM-DD 00:00')
    var endDate = moment(data.endDate).utc().format('YYYY-MM-DD 00:00')
    var periodStartDate = moment(period.dateStart).utc().format('YYYY-MM-DD 00:00')
    var periodEndDate = moment(period.dateEnd).utc().format('YYYY-MM-DD 00:00')
    const takeStart = period.organization.rules.takeStart

    const periodString = period.organization.rules.period

    let halfPeriod
    let halfPeriodDuration
    if (periodString === 'M') {
      halfPeriodDuration = 15
      halfPeriod = 'd'
    } else if (periodString === 'w') {
      halfPeriodDuration = 4
      halfPeriod = 'd'
    } else if (periodString === 'd') {
      halfPeriodDuration = 12
      halfPeriod = 'h'
    } else if (periodString === 'y') {
      halfPeriodDuration = 6
      halfPeriod = 'M'
    }
    const startLimitDown = moment(period.dateStart).utc().subtract(halfPeriodDuration, halfPeriod).format('YYYY-MM-DD 00:00')
    const startLimitUp = moment(period.dateStart).utc().add(halfPeriodDuration, halfPeriod).format('YYYY-MM-DD 00:00')
    const endLimitDown = moment(period.dateEnd).utc().subtract(halfPeriodDuration, halfPeriod).format('YYYY-MM-DD 00:00')
    const endLimitUp = moment(period.dateEnd).utc().add(halfPeriodDuration, halfPeriod).format('YYYY-MM-DD 00:00')
    if (startDate < startLimitDown || startDate > startLimitUp || endDate < endLimitDown || endDate > endLimitUp) {
      ctx.throw(422, 'La fechas no se pueden recorrer más de la mitad del periodo')
    }

    period.set({
      dateStart: startDate,
      dateEnd: endDate
    })

    await period.save()
    var modifiedCycles = new Set()

    if (startDate !== periodStartDate) {
      let newEndPreviousPeriod = moment(startDate).utc().subtract(1, 'd').format('YYYY-MM-DD 00:00')
      const previousPeriod = await Period.findOneAndUpdate({
        period: period.period - 1,
        cycle: period.cycle,
        organization: period.organization._id,
        isDeleted: false
      }, {
        dateEnd: newEndPreviousPeriod
      })
      if (previousPeriod) { modifiedCycles.add(previousPeriod.cycle) }
      modifiedCycles.add(period.cycle)
    }

    if (endDate !== periodEndDate) {
      let newStartNextPeriod = moment(endDate).utc().add(1, 'd').format('YYYY-MM-DD 00:00')
      const nextPeriod = await Period.findOneAndUpdate({
        period: period.period + 1,
        cycle: period.cycle,
        organization: period.organization._id,
        isDeleted: false
      }, {
        dateStart: newStartNextPeriod
      })

      if (nextPeriod) { modifiedCycles.add(nextPeriod._id) }
      modifiedCycles.add(period.cycle)
    }

    modifiedCycles = Array.from(modifiedCycles)

    if (modifiedCycles.length) {
      const periodsCycles = await Period.find({
        cycle: {$in: modifiedCycles},
        organization: period.organization._id,
        isDeleted: false
      }).populate('cycle').sort({dateStart: 1})

      var lastCycle, periodNumber
      for (let periodCycle of periodsCycles) {
        let periodStartDate = moment(periodCycle.dateStart).utc().format('YYYY-MM-DD 00:00')
        let periodEndDate = moment(periodCycle.dateEnd).utc().format('YYYY-MM-DD 00:00')

        let cyclesBetween = await Cycle.find({ $or: [
        {dateStart: {$lte: periodStartDate}, dateEnd: {$gte: periodStartDate}},
        {dateStart: {$lte: periodEndDate}, dateEnd: {$gte: periodEndDate}}],
          organization: periodCycle.organization._id,
          isDeleted: false
        })

        if (cyclesBetween.length > 0) {
          let currentCycle
          if (cyclesBetween.length > 1) {
            currentCycle = (takeStart) ? cyclesBetween[cyclesBetween.length - 1]._id : cyclesBetween[0]._id
          } else {
            currentCycle = cyclesBetween[0]._id
          }

          if (String(lastCycle) !== String(currentCycle)) {
            periodNumber = 1
          }

          await periodCycle.set({
            cycle: currentCycle,
            period: periodNumber++
          })
          await periodCycle.save()
          lastCycle = currentCycle
        }
      }
    }

    ctx.body = {
      data: period.toPublic()
    }
  }
})
