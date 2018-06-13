// node tasks/organization/generate-periods.js --uuid
require('../../config')
require('lib/databases/mongo')

const moment = require('moment')

const Task = require('lib/task')
const { Organization, Cycle, Period, Rule } = require('models')

const task = new Task(
  async function (argv) {
    if (!argv.uuid) {
      throw new Error('You need to provide an organization')
    }

    if (!argv.rule) {
      throw new Error('You need to provide an business rule')
    }

    const organization = await Organization.findOne({uuid: argv.uuid})
    const rule = await Rule.findOne({uuid: argv.rule})
    if (!rule) {
      throw new Error('Business rules not found')
    }
    const cycles = await Cycle.find({organization: organization._id, isDeleted: false, rule: rule._id}).sort({dateStart: 1})
    if (cycles.length === 0) { throw new Error('No hay ciclos disponibles') }

    if (isNaN(rule.periodDuration) || parseInt(rule.periodDuration) < 1) {
      throw new Error('The periodDuration should be a positive integer')
    }

    if (!(['M', 'w', 'd', 'y'].indexOf(rule.period) >= 0)) {
      throw new Error('The given period has a invalid format')
    }

    const periodDuration = rule.periodDuration
    const period = rule.period
    const takeStart = rule.takeStart

    var startDate = moment.utc(moment(rule.startDate).utc())
    var endDate = moment.utc(moment(cycles[cycles.length - 1].dateEnd).utc())

    var auxStartDate = moment.utc(moment(rule.startDate).utc())
    var cyclesStartDate = moment.utc(moment(cycles[0].dateStart).utc())

    var currentEndDate
    var periodNumber
    var lastCycle
    do {
      currentEndDate = moment(startDate).utc().add(periodDuration, period)
      currentEndDate = moment(currentEndDate).utc().subtract(1, 'd')

      let cyclesBetween = await Cycle.find({ $or: [
        {dateStart: {$lte: startDate}, dateEnd: {$gte: startDate}},
        {dateStart: {$lte: currentEndDate}, dateEnd: {$gte: currentEndDate}}],
        organization: organization._id,
        rule: rule._id,
        isDeleted: false
      })

      if (cyclesBetween.length > 0) {
        let cycle
        if (cyclesBetween.length > 1) {
          cycle = (takeStart) ? cyclesBetween[cyclesBetween.length - 1]._id : cyclesBetween[0]._id
        } else {
          cycle = cyclesBetween[0]._id
        }

        if (String(lastCycle) !== String(cycle)) {
          periodNumber = 1
        }

        await Period.create({
          organization: organization._id,
          dateStart: startDate,
          dateEnd: currentEndDate,
          cycle: cycle,
          period: periodNumber++,
          rule: rule._id
        })

        lastCycle = cycle
      }

      startDate = moment(currentEndDate).utc().add(1, 'd')
    } while (currentEndDate <= endDate)

    currentEndDate = moment(auxStartDate).utc().subtract(1, 'd')
    var currentStartDate
    let modifiedCycles = new Set()
    do {
      currentStartDate = moment(currentEndDate).utc().subtract(periodDuration, period)
      currentStartDate = moment(currentStartDate).utc().add(1, 'd')
      let cyclesBetween = await Cycle.find({ $or: [
        {dateStart: {$lte: currentStartDate}, dateEnd: {$gte: currentStartDate}},
        {dateStart: {$lte: currentEndDate}, dateEnd: {$gte: currentEndDate}}],
        organization: organization._id,
        rule: rule._id,
        isDeleted: false
      })

      if (cyclesBetween.length > 0) {
        let cycle
        if (cyclesBetween.length > 1) {
          cycle = (takeStart) ? cyclesBetween[cyclesBetween.length - 1]._id : cyclesBetween[0]._id
        } else {
          cycle = cyclesBetween[0]._id
        }
        modifiedCycles.add(cycle)
        await Period.create({
          organization: organization._id,
          dateStart: currentStartDate,
          dateEnd: currentEndDate,
          cycle: cycle,
          rule: rule._id
        })

        lastCycle = cycle
      }

      currentEndDate = moment(currentStartDate).utc().subtract(1, 'd')
    } while (currentStartDate >= cyclesStartDate)

    modifiedCycles = Array.from(modifiedCycles)

    if (modifiedCycles.length) {
      const periodsCycles = await Period.find({
        cycle: {$in: modifiedCycles},
        organization: organization._id,
        isDeleted: false,
        rule: rule._id
      }).populate('cycle').sort({dateStart: 1})

      let lastCycle, periodNumber
      for (let periodCycle of periodsCycles) {
        let currentCycle = periodCycle.cycle._id
        if (String(lastCycle) !== String(currentCycle)) {
          periodNumber = 1
        }

        await periodCycle.set({
          period: periodNumber++
        })
        await periodCycle.save()
        lastCycle = currentCycle
      }
    }

    return true
  }
)

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
