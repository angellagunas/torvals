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
  }).populate('organization rule')

  if (projects.length === 0) {
    console.log('No projects to verify ...')

    return true
  }

  for (var project of projects) {
    if (project.rule) {
      let sales = project.rule.salesUpload
      let forecast = project.rule.forecastCreation
      let adjustment = project.rule.rangeAdjustment
      let adjustmenRequest = project.rule.rangeAdjustmentRequest + adjustment
      let consolidate = project.rule.consolidation + adjustment

      let date
      if (argv.date) {
        date = moment(argv.date, 'YYYY-MM-DD', true).utc()
      } else {
        date = moment().utc()
      }

      if (!date.isValid()) {
        console.log('Error: Invalid date format (YYYY-MM-DD)')
        return false
      }

      let cycle = await Cycle.findOne({
        organization: project.organization._id,
        dateStart: {$lte: date},
        dateEnd: {$gte: date},
        isDeleted: false,
        rule: project.rule._id
      })
      if (cycle) {
        let currentDays
        currentDays = moment(cycle.dateStart).utc().format('YYYY-MM-DD')

        let diff = moment.duration(date.diff(currentDays)).asDays()
        let status = ''
        if (diff <= sales) {
          status = 'salesUpload'
        } else if (diff <= forecast) {
          if (project.cycleStatus === 'salesUpload') {
            project.set({ hasForecast: false })
          }
          status = 'forecastCreation'
        } else if (diff <= adjustment) {
          status = 'rangeAdjustment'
        } else if (diff <= adjustmenRequest) {
          status = 'rangeAdjustmentRequest'
        } else if (diff <= consolidate) {
          status = 'consolidation'
        } else {
          status = 'empty'
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
