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
    const cycles = await Cycle.find({organization: organization._id})
    const periodDuration = organization.rules.periodDuration
    const period = organization.rules.period
    const takeStart = organization.rules.takeStart

    var startDate = moment(moment(organization.rules.startDate).format('YYYY-MM-DD'))
    var endDate = moment(moment(cycles[cycles.length - 1].dateEnd).format('YYYY-MM-DD'))
    var currentEndDate
    var periodNumber = 1
    do {
      currentEndDate = moment(startDate).add(periodDuration, period)
      currentEndDate = moment(currentEndDate).subtract(1, 'd')

      let cyclesBetween = await Cycle.find({ $or: [
        {dateStart: {$lte: startDate}, dateEnd: {$gte: startDate}},
        {dateStart: {$lte: currentEndDate}, dateEnd: {$gte: currentEndDate}}]})

      if (cyclesBetween.length > 0) {
        let cycle
        if (cyclesBetween.length > 1) {
          cycle = (takeStart) ? cyclesBetween[cyclesBetween.length - 1]._id : cyclesBetween[0]._id
        } else {
          cycle = cyclesBetween[0]._id
        }

        await Period.create({
          organization: organization._id,
          dateStart: startDate,
          dateEnd: currentEndDate,
          cycle: cycle,
          period: periodNumber++
        })
      }

      startDate = moment(currentEndDate).add(1, 'd')
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
