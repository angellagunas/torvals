// node tasks/organization/generate-cycles.js --uuid
require('../../config')
require('lib/databases/mongo')

const moment = require('moment')

const Task = require('lib/task')
const { Organization, Cycle } = require('models')

const task = new Task(
  async function (argv) {
    if (!argv.uuid) {
      throw new Error('You need to provide an organization')
    }
    const organization = await Organization.findOne({uuid: argv.uuid})
    const season = organization.rules.season
    const cycleDuration = organization.rules.cycleDuration
    const cycle = organization.rules.cycle

    var startDate = moment(organization.rules.startDate).format('YYYY-MM-DD')

    for (let i = 1; i <= season; i++) {
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

    return true
  }
)

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
