// node tasks/organization/generate-periods.js --uuid
require('../../config')
require('lib/databases/mongo')

const moment = require('moment')

const Task = require('lib/task')
const { Organization, Cycle, Period } = require('models')

const task = new Task(
  async function (argv) {
    if (!argv.uuid) {
      throw new Error('You need to provide an organization')
    }
    const organization = await Organization.findOne({uuid: argv.uuid})
    const cycles = await Cycle.find({organization: organization._id, isDeleted: false}).sort({dateStart: 1})

    if (cycles.length === 0) { throw new Error('No hay ciclos disponibles') }

    if (isNaN(organization.rules.periodDuration) || parseInt(organization.rules.periodDuration) < 1) {
      throw new Error('The periodDuration should be a positive integer')
    }

    if (!(['M', 'w', 'd', 'y'].indexOf(organization.rules.period) >= 0)) {
      throw new Error('The given period has a invalid format')
    }

    const periodDuration = organization.rules.periodDuration
    const period = organization.rules.period
    const takeStart = organization.rules.takeStart
    await Period.deleteMany({organization: organization._id})
    var startDate = moment.utc(moment(cycles[0].dateStart).utc())
    var endDate = moment.utc(moment(cycles[cycles.length - 1].dateEnd).utc())
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
          period: periodNumber++
        })

        lastCycle = cycle
      }

      startDate = moment(currentEndDate).utc().add(1, 'd')
    } while (currentEndDate <= endDate)

    return true
  }
)

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
