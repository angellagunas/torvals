// node tasks/organization/append-cycles-periods.js --uuid --cycles
require('../../config')
require('lib/databases/mongo')

const moment = require('moment')
const Task = require('lib/task')
const { Organization, Cycle, Period } = require('models')

const task = new Task(
  async function (argv) {
    if (!argv.uuid || !argv.cycles) {
      throw new Error('You need to provide an organization')
    }
    const organization = await Organization.findOne({uuid: argv.uuid})
    const {
      cycleDuration,
      cycle,
      takeStart,
      periodDuration,
      period
    } = organization.rules

    const cycles = await Cycle
      .findOne({
        organization: organization._id,
        isDeleted: false
      })
      .sort({ dateStart: -1 })
    if (!cycles) throw new Error('Cycles unavailable')

    const totalToAdd = argv.cycles
    let cycleNumber = cycles.cycle
    let startDate = moment(cycles.dateEnd).utc().add(1, 'd')
    let previousYear = moment(cycles.dateStart).utc().format('YYYY')

    let endDate
    for (let i = 1; i <= totalToAdd; i++) {
      endDate = moment(startDate).utc().add(cycleDuration, cycle)
      endDate = moment(endDate).utc().subtract(1, 'd')
      let startYear = moment(startDate).utc().format('YYYY')
      let endYear = moment(endDate).utc().format('YYYY')

      if (startYear !== endYear) {
        if (takeStart) {
          cycleNumber = 1
        } else {
          cycleNumber++
        }
      } else if (previousYear !== endYear) {
        cycleNumber = 1
      } else {
        cycleNumber++
      }

      await Cycle.create({
        organization: organization._id,
        dateStart: startDate,
        dateEnd: endDate,
        cycle: cycleNumber
      })

      previousYear = endYear
      startDate = moment(endDate).utc().add(1, 'd')
    }

    const periods = await Period
      .findOne({
        organization: organization._id,
        isDeleted: false
      })
      .sort({ dateStart: -1 })
    startDate = moment(periods.dateEnd).utc().add(1, 'd')
    let periodNumber
    let lastCycle
    let currentEndDate
    do {
      currentEndDate = moment(startDate).utc().add(periodDuration, period)
      currentEndDate = moment(currentEndDate).utc().subtract(1, 'd')

      let cyclesBetween = await Cycle.find({
        $or: [{
          dateStart: { $lte: startDate },
          dateEnd: { $gte: startDate }
        }, {
          dateStart: { $lte: currentEndDate },
          dateEnd: { $gte: currentEndDate }
        }],
        organization: organization._id,
        isDeleted: false
      })

      if (cyclesBetween.length > 0) {
        let cycle
        if (cyclesBetween.length > 1) {
          cycle = (takeStart)
            ? cyclesBetween[cyclesBetween.length - 1]._id
            : cyclesBetween[0]._id
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
