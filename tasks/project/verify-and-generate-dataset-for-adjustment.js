// node tasks/verify-datasets.js
require('../../config')
require('lib/databases/mongo')

const Api = require('lib/abraxas/api')
const Task = require('lib/task')
const { Project, DataSet } = require('models')
const request = require('lib/request')

const task = new Task(async function (argv) {
  console.log('Fetching existing Projects...')

  const projects = await Project.find({
    status: 'pendingRows',
    isDeleted: false
  }).populate('activeDataset')

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

    try {
      var res = await Api.getProject(project.externalId)
    } catch (e) {
      console.log(e.message)
      return false
    }

    if (res.dataset && res.status === 'ready') {
      console.log(`Creating dataset for adjustment of project ${project.name} ...`)

      try {
        var resFilter = await Api.filterProject(project.externalId, res.dataset.date_max)
      } catch (e) {
        console.log(e.message)
        return false
      }

      if (resFilter.message === 'Ok') {
        var dataset = await DataSet.create({
          name: 'New Adjustment',
          description: '',
          organization: project.organization,
          createdBy: projectDataset.conciliatedBy,
          uploadedBy: projectDataset.conciliatedBy,
          uploaded: true,
          project: project._id,
          externalId: resFilter._id,
          source: 'adjustment',
          status: 'pendingRows'
        })

        project.datasets.push({
          dataset: dataset,
          columns: []
        })

        project.set({
          activeDataset: dataset,
          businessRules: res.rules,
          dateMax: res.dataset.date_max,
          dateMin: res.dataset.date_min
        })

        await project.save()
      }

      project.set({
        status: 'processing'
      })

      await project.save()
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
