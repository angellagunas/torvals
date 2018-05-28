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
    const organization = await Organization.findOne({uuid: argv.uuid})
    const cycleDuration = organization.rules.cycleDuration
    const cycle = organization.rules.cycle

    await Cycle.deleteMany({organization: organization._id})

    var startDate = moment(organization.rules.startDate).format('YYYY-MM-DD')

    var currentDateDiff
    if (cycle === 'M') {
      currentDateDiff = Math.ceil(moment.duration(moment(startDate).add(1, 'y').diff(startDate)).asMonths() / cycleDuration)
    } else if (cycle === 'w') {
      currentDateDiff = Math.ceil(moment.duration(moment(startDate).add(1, 'y').diff(startDate)).asWeeks() / cycleDuration)
    } else if (cycle === 'd') {
      currentDateDiff = Math.ceil(moment.duration(moment(startDate).add(1, 'y').diff(startDate)).asDays() / cycleDuration)
    }

    for (let i = 1; i <= currentDateDiff; i++) {
      let endDate = moment(startDate).add(cycleDuration, cycle)
      endDate = moment(endDate).subtract(1, 'd')

      await Cycle.create({
        organization: organization._id,
        dateStart: startDate,
        dateEnd: endDate,
        cycle: i
      })

      startDate = moment(endDate).add(1, 'd')
    }
    generatePeriods.run({uuid: organization.uuid})
    return true
  }
)

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
