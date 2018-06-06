// node tasks/organization/generate-cycles.js --uuid
require('../../config')
require('lib/databases/mongo')

const moment = require('moment')

const Task = require('lib/task')
const generatePeriods = require('tasks/organization/generate-periods')

const { Organization, Cycle, Rule } = require('models')

const task = new Task(
  async function (argv) {
    if (!argv.uuid) {
      throw new Error('You need to provide an organization')
    }

    const organization = await Organization.findOne({uuid: argv.uuid})
    const rule = await Rule.findOne({organization: organization._id, isCurrent: true})

    const cycleDuration = rule.cycleDuration
    const cycle = rule.cycle
    const season = rule.season
    const cyclesAvailable = rule.cyclesAvailable
    const takeStart = rule.takeStart

    var startDate = moment(rule.startDate).utc().format('YYYY-MM-DD')
    var currentDateDiff
    if (cycle === 'M') {
      startDate = moment(startDate).subtract(season, 'M')
      currentDateDiff = Math.ceil(moment.duration(moment().diff(startDate)).asMonths() / cycleDuration)
    } else if (cycle === 'w') {
      startDate = moment(startDate).subtract(season, 'w')
      currentDateDiff = Math.ceil(moment.duration(moment().diff(startDate)).asWeeks() / cycleDuration)
    } else if (cycle === 'd') {
      startDate = moment(startDate).subtract(season, 'd')
      currentDateDiff = Math.ceil(moment.duration(moment().diff(startDate)).asDays() / cycleDuration)
    } else if (cycle === 'y') {
      startDate = moment(startDate).subtract(season, 'y')
      currentDateDiff = Math.ceil(moment.duration(moment().diff(startDate)).asYears() / cycleDuration)
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
        cycle: cycleNumber,
        rule: rule._id
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
