// node tasks/organization/generate-cycles.js --uuid
require('../../config')
require('lib/databases/mongo')

const moment = require('moment')

const Task = require('lib/task')
const generatePeriods = require('tasks/organization/generate-periods')

const { Organization, Cycle } = require('models')

const task = new Task(
  async function (argv) {
    if (!argv.uuid) {
      throw new Error('You need to provide an organization')
    }

    const organization = await Organization.findOne({ uuid: argv.uuid })

    const cycleDuration = organization.rules.cycleDuration
    if (isNaN(parseInt(cycleDuration)) || parseInt(cycleDuration) < 1) {
      throw new Error('The cycleDuration should be a positive integer')
    }

    const cycle = organization.rules.cycle
    if (!(['M', 'w', 'd', 'y'].indexOf(cycle) >= 0)) {
      throw new Error('The given cycle has a invalid format')
    }

    const season = organization.rules.season
    if (isNaN(parseInt(season)) || parseInt(season) < 1) {
      throw new Error('The season should be a positive integer')
    }

    const cyclesAvailable = organization.rules.cyclesAvailable
    if (isNaN(parseInt(cyclesAvailable)) || parseInt(cyclesAvailable) < 1) {
      throw new Error('The cyclesAvailable should be a positive integer')
    }

    const takeStart = organization.rules.takeStart

    await Cycle.deleteMany({ organization: organization._id })

    var startDate = moment(organization.rules.startDate).utc().format('YYYY-MM-DD')
    var currentDateDiff
    if (cycle === 'M') {
      startDate = moment.utc(startDate, 'YYYY-MM-DD').subtract(season, 'M')
      currentDateDiff = Math.ceil(moment.duration(moment.utc().diff(startDate)).asMonths() / cycleDuration)
    } else if (cycle === 'w') {
      startDate = moment.utc(startDate, 'YYYY-MM-DD').subtract(season, 'w')
      currentDateDiff = Math.ceil(moment.duration(moment.utc().diff(startDate)).asWeeks() / cycleDuration)
    } else if (cycle === 'd') {
      startDate = moment.utc(startDate, 'YYYY-MM-DD').subtract(season, 'd')
      currentDateDiff = Math.ceil(moment.duration(moment.utc().diff(startDate)).asDays() / cycleDuration)
    } else if (cycle === 'y') {
      startDate = moment.utc(startDate, 'YYYY-MM-DD').subtract(season, 'y')
      currentDateDiff = Math.ceil(moment.duration(moment.utc().diff(startDate)).asYears() / cycleDuration)
    }

    currentDateDiff += cyclesAvailable
    var previousYear
    var cycleNumber
    for (let i = 1; i <= currentDateDiff; i++) {
      let endDate = moment(startDate).utc().add(cycleDuration, cycle)
      endDate = moment(endDate).utc().subtract(1, 'd')
      let startYear = moment(startDate).format('YYYY')
      let endYear = moment(endDate).format('YYYY')

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
    await generatePeriods.run({uuid: organization.uuid})
    return true
  }
)

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
