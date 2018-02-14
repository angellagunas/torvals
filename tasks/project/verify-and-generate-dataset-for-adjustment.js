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
  })

  if (projects.length === 0) {
    console.log('No projects to verify ...')

    return true
  }

  console.log('Obtaining Abraxas API token ...')
  await Api.fetch()
  const apiData = Api.get()

  if (!apiData.token) {
    throw new Error('There is no API endpoint configured!')
  }

  for (var project of projects) {
    console.log(`Verifying status of project ${project.name} ...`)
    var options = {
      url: `${apiData.hostname}${apiData.baseUrl}/projects/${project.externalId}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiData.token}`
      },
      json: true,
      persist: true
    }

    var res = await request(options)

    if (res.dataset && res.status === 'ready') {
      console.log(`Creating dataset for adjustment of project ${project.name} ...`)

      options = {
        url: `${apiData.hostname}${apiData.baseUrl}/filter/projects/${project.externalId}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiData.token}`
        },
        body: {
          filter_date_end: res.dataset.date_max
        },
        json: true,
        persist: true
      }

      var resFilter = await request(options)

      if (resFilter.message === 'Ok') {
        var dataset = await DataSet.create({
          name: 'New Adjustment',
          description: '',
          organization: project.organization,
          createdBy: project.createdBy,
          uploadedBy: project.createdBy,
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

        project.activeDataset = dataset
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
