// node tasks/project/verify-cycle-status.js
require('../../config')
require('lib/databases/mongo')
const moment = require('moment')

const Task = require('lib/task')
const { Project, Cycle } = require('models')

const task = new Task(async function (argv) {
  console.log('Fetching existing Projects...')

  const projects = await Project.find({
    isDeleted: false
  }).populate('organization')

  if (projects.length === 0) {
    console.log('No projects to verify ...')

    return true
  }

  for (var project of projects) {
    if (project.organization.rules && project.organization.rules.salesUpload && project.organization.rules.forecastCreation &&
      project.organization.rules.rangeAdjustment && project.organization.rules.rangeAdjustmentRequest && project.organization.rules.consolidation) {
      let sales = project.organization.rules.salesUpload
      let forecast = project.organization.rules.forecastCreation + sales
      let adjustment = project.organization.rules.rangeAdjustment + forecast
      let adjustmenRequest = project.organization.rules.rangeAdjustmentRequest + adjustment
      let consolidate = project.organization.rules.consolidation + adjustmenRequest

      let cycle = await Cycle.findOne({
        organization: project.organization._id,
        dateStart: {$lte: moment().utc()},
        dateEnd: {$gte: moment().utc()},
        isDeleted: false
      })
      if (cycle) {
        let currentDays = moment(cycle.dateStart).utc().format('YYYY-MM-DD')
        let diff = moment.duration(moment().diff(currentDays)).asDays()
        let status = ''
        if (diff <= sales) {
          status = 'salesUpload'
        } else if (diff <= forecast) {
          status = 'forecastCreation'
        } else if (diff <= adjustment) {
          status = 'rangeAdjustment'
        } else if (diff <= adjustmenRequest) {
          status = 'rangeAdjustmentRequest'
        } else if (diff <= consolidate) {
          status = 'consolidation'
        }

        project.set({ cycleStatus: status })
        await project.save()
      }
    }
  }

  console.log(`Successfully verified ${projects.length} projects cycle status`)
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
