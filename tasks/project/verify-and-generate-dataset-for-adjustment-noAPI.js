// node tasks/verify-datasets.js
require('../../config')
require('lib/databases/mongo')
const moment = require('moment')

const Task = require('lib/task')
const { Project, DataSet } = require('models')
const filterDataset = require('queues/filter-dataset')

const task = new Task(async function (argv) {
  console.log('Fetching existing Projects...')

  const projects = await Project.find({
    status: 'pendingRows',
    isDeleted: false
  }).populate('mainDataset activeDataset')

  if (projects.length === 0) {
    console.log('No projects to verify ...')

    return true
  }

  for (var project of projects) {
    console.log(`Verifying status of project ${project.name} ...`)
    var projectDataset = project.activeDataset

    if (!projectDataset) {
      await project.populate('datasets.dataset').execPopulate()
      projectDataset = project.datasets[0].dataset
    }

    if (!projectDataset.conciliatedBy || !projectDataset.createdBy) {
      var projectDataset = project.mainDataset
    }

    if (project.mainDataset && project.mainDataset.status === 'ready') {
      console.log(`Creating dataset for adjustment of project ${project.name} ...`)

      var dataset = await DataSet.create({
        name: 'New Adjustment',
        description: '',
        organization: project.organization,
        createdBy: projectDataset.conciliatedBy || projectDataset.createdBy,
        uploadedBy: projectDataset.conciliatedBy || projectDataset.createdBy,
        uploaded: true,
        project: project._id,
        source: 'adjustment',
        status: 'pendingRows'
      })

      project.datasets.push({
        dataset: dataset,
        columns: []
      })

      project.set({
        activeDataset: dataset,
        dateMax: project.mainDataset.dateMax,
        dateMin: project.mainDataset.dateMin
      })

      await project.save()

      let dateEnd = moment.utc(project.dateMax, 'YYYY-MM-DD')
      let dateStart = moment.utc(dateEnd).subtract(4, 'months')

      project.set({
        status: 'processing'
      })

      await project.save()

      filterDataset.add({
        project: project.uuid,
        dataset: dataset.uuid
      })
    } else {
      console.log(`Project ${project.name} is still conciliating!`)
    }
  }

  console.log(`Successfully verified ${projects.length} projects`)
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
