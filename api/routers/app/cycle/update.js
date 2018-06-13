const Route = require('lib/router/route')
const moment = require('moment')
const {Cycle, Period} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  handler: async function (ctx) {
    var cycleUuid = ctx.params.uuid
    var data = ctx.request.body

    const cycle = await Cycle.findOne({uuid: cycleUuid, isDeleted: false}).populate('organization rule')
    ctx.assert(cycle, 404, 'Ciclo no encontrado')
    var startDate = moment(data.startDate).utc().format('YYYY-MM-DD 00:00')
    var endDate = moment(data.endDate).utc().format('YYYY-MM-DD 00:00')
    var cycleStartDate = moment(cycle.dateStart).utc().format('YYYY-MM-DD 00:00')
    var cycleEndDate = moment(cycle.dateEnd).utc().format('YYYY-MM-DD 00:00')
    const takeStart = cycle.rule.takeStart
    const cycleString = cycle.rule.cycle

    let halfCycle
    let halfCycleDuration
    if (cycleString === 'M') {
      halfCycleDuration = 15
      halfCycle = 'd'
    } else if (cycleString === 'w') {
      halfCycleDuration = 4
      halfCycle = 'd'
    } else if (cycleString === 'd') {
      halfCycleDuration = 12
      halfCycle = 'h'
    } else if (cycleString === 'y') {
      halfCycleDuration = 6
      halfCycle = 'M'
    }

    const startLimitDown = moment(cycle.dateStart).utc().subtract(halfCycleDuration, halfCycle).format('YYYY-MM-DD 00:00')
    const startLimitUp = moment(cycle.dateStart).utc().add(halfCycleDuration, halfCycle).format('YYYY-MM-DD 00:00')
    const endLimitDown = moment(cycle.dateEnd).utc().subtract(halfCycleDuration, halfCycle).format('YYYY-MM-DD 00:00')
    const endLimitUp = moment(cycle.dateEnd).utc().add(halfCycleDuration, halfCycle).format('YYYY-MM-DD 00:00')

    if (startDate < startLimitDown || startDate > startLimitUp || endDate < endLimitDown || endDate > endLimitUp) {
      ctx.throw(422, 'La fechas no se pueden recorrer más de la mitad del ciclo')
    }

    let nextCycle = await Cycle.findOne({
      rule: cycle.rule._id,
      dateStart: {$gte: cycleEndDate},
      organization: cycle.organization._id,
      isDeleted: false
    }).sort({dateEnd: 1})

    let previousCycle = await Cycle.findOne({
      rule: cycle.rule._id,
      dateEnd: {$lte: cycleStartDate},
      organization: cycle.organization._id,
      isDeleted: false
    }).sort({dateEnd: -1})

    cycle.set({
      dateStart: startDate,
      dateEnd: endDate
    })

    await cycle.save()
    var modifiedCycles = new Set()

    if (startDate !== cycleStartDate) {
      let newEndPreviousCycle = moment(startDate).utc().subtract(1, 'd').format('YYYY-MM-DD 00:00')

      if (previousCycle) {
        previousCycle.set({
          dateEnd: newEndPreviousCycle
        })
        previousCycle.save()
        modifiedCycles.add(previousCycle._id)
      }

      modifiedCycles.add(cycle._id)
    }

    if (endDate !== cycleEndDate) {
      let newStartNextCycle = moment(endDate).utc().add(1, 'd').format('YYYY-MM-DD 00:00')

      if (nextCycle) {
        nextCycle.set({
          dateStart: newStartNextCycle
        })
        nextCycle.save()
        modifiedCycles.add(nextCycle._id)
      }

      modifiedCycles.add(cycle._id)
    }

    modifiedCycles = Array.from(modifiedCycles)

    if (modifiedCycles.length) {
      const periods = await Period.find({
        cycle: {$in: modifiedCycles},
        organization: cycle.organization._id,
        isDeleted: false
      }).populate('cycle').sort({dateStart: 1})

      var lastCycle, periodNumber
      for (let period of periods) {
        let periodStartDate = moment(period.dateStart).utc().format('YYYY-MM-DD 00:00')
        let periodEndDate = moment(period.dateEnd).utc().format('YYYY-MM-DD 00:00')

        let cyclesBetween = await Cycle.find({ $or: [
        {dateStart: {$lte: periodStartDate}, dateEnd: {$gte: periodStartDate}},
        {dateStart: {$lte: periodEndDate}, dateEnd: {$gte: periodEndDate}}],
          organization: cycle.organization._id,
          rule: cycle.rule._id,
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

          await period.set({
            cycle: currentCycle,
            period: periodNumber++
          })
          await period.save()
          lastCycle = currentCycle
        }
      }
    }

    ctx.body = {
      data: cycle.toPublic()
    }
  }
})
