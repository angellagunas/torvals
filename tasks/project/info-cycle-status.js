// node tasks/project/verify-cycle-status.js --project uuid
require('../../config')
require('lib/databases/mongo')
const moment = require('moment')

const Task = require('lib/task')
const { Project, Cycle } = require('models')

const task = new Task(async function (argv) {
  console.log('Fetching existing Projects...')

  let matchFilters = {}

  if (!argv.project) {
    matchFilters = {
      project: argv.project
    }
  }

  const projects = await Project.find({
    isDeleted: false,
    ...matchFilters
  }).populate('organization rule')

  if (projects.length === 0) {
    console.log('No projects to verify ...')

    return true
  }

  projectDescription = []
  for (let project of projects) {
    if (!project.rule) {
      console.log(`The project: ${project.name}`)
      console.log('Rules are missing.')
      continue
    }
    const {
      salesUpload,
      forecastCreation,
      rangeAdjustment,
      rangeAdjustmentRequest,
      consolidation
    } = project.rule

    const date = argv.date
      ? moment(argv.date, 'YYYY-MM-DD', true).utc()
      : moment().utc()

    if (!date.isValid()) {
      console.log('Error: Invalid date format (YYYY-MM-DD)')
      return false
    }

    const cycle = await Cycle.findOne({
      organization: project.organization._id,
      dateStart: {$lte: date},
      dateEnd: {$gte: date},
      isDeleted: false,
      rule: project.rule._id
    })
    if (!cycle) {
      console.log(`The project: ${project.name}`)
      console.log('Cycle is missing.')
      continue
    }
    const currentDays = moment(cycle.dateStart).utc().format('YYYY-MM-DD')
    const diff = moment.duration(date.diff(currentDays)).asDays()

    let status = 'Undefined'
    let daysToEnd = 0
    if (diff <= salesUpload) {
      status = 'salesUpload'
      daysToEnd = salesUpload - diff
    } else if (diff <= forecastCreation) {
      status = 'forecastCreation'
      daysToEnd = salesUpload + forecastCreation - diff
    } else if (diff <= rangeAdjustment) {
      status = 'rangeAdjustment'
      daysToEnd = salesUpload + forecastCreation + rangeAdjustment - diff
    } else if (diff <= (rangeAdjustmentRequest + salesUpload)) {
      status = 'rangeAdjustmentRequest'
      daysToEnd = salesUpload + forecastCreation + rangeAdjustment + rangeAdjustmentRequest - diff
    } else if (diff <= (consolidation + rangeAdjustment)) {
      status = 'consolidation'
      daysToEnd = salesUpload + forecastCreation + rangeAdjustment + rangeAdjustmentRequest + consolidation - diff
    } else {
      status = 'empty'
    }
    projectDescription.push({
      Project: {
        uuid: project.uuid,
        project: project.name,
        cycleStatus: project.cycleStatus,
        realStatus: status,
        currentCycleStart: currentDays,
        currentCycleEnd: moment(cycle.dateEnd).utc().format('YYYY-MM-DD'),
        daysPassed: diff,
        rulesDatesInfo: {
          salesUpload,
          forecastCreation,
          rangeAdjustment,
          rangeAdjustmentRequest,
          consolidation
        },
        daysToEnd
      }
    })
  }
  console.info(projectDescription)

  console.log(`Successfully verified ${projects.length} projects cycle status`)
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
