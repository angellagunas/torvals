// node tasks/verify-datasets.js
require('../../config')
require('lib/databases/mongo')

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

  for (let project of projects) {
    console.log(`Verifying status of project ${project.name} ...`)
    let projectDataset = project.activeDataset
    if (!projectDataset) {
      await project.populate('datasets[0].dataset').execPopulate()
      projectDataset = project.datasets[0].dataset
    }

    if (!projectDataset.conciliatedBy || !projectDataset.createdBy) {
      projectDataset = project.mainDataset
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
        status: 'pendingRows',
        catalogItems: projectDataset.catalogItems,
        cycles: projectDataset.cycles,
        periods: projectDataset.periods,
        columns: projectDataset.columns
      })

      project.datasets.push({
        dataset: dataset,
        columns: []
      })

      project.set({
        activeDataset: dataset
      })

      await project.save()

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
