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
    status: 'adjustment',
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
    console.log(`Creating dataset for adjustment of project ${project.externalId} ...`)
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
    console.log(res)

    if (res.dataset) {
      options = {
        url: `${apiData.hostname}${apiData.baseUrl}/filter/projects/${project.externalId}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiData.token}`
        },
        body: {
          filter_date_ini: res.dataset.date_min,
          filter_date_end: res.dataset.date_max
        },
        json: true,
        persist: true
      }

      var resFilter = await request(options)
      console.log(resFilter)

      if (resFilter.message === 'Ok') {
        options = {
          url: `${apiData.hostname}${apiData.baseUrl}/datasets/${resFilter._id}`,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${apiData.token}`
          },
          json: true,
          persist: true
        }

        var resDataset = await request(options)
        console.log(resDataset)
        var dataset = await DataSet.create({
          name: 'New Adjustment',
          description: '',
          organization: project.organization,
          createdBy: project.createdBy,
          uploadedBy: project.createdBy,
          uploaded: true,
          project: project._id,
          externalId: res._id,
          source: 'adjustment',
          status: 'processing'
        })

        project.datasets.push({
          dataset: dataset,
          columns: []
        })

        await project.save()

        await dataset.process(resDataset)

        options = {
          url: `${apiData.hostname}${apiData.baseUrl}/rows/datasets/${dataset.externalId}`,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${apiData.token}`
          },
          json: true,
          persist: true
        }

        resDataset = await request(options)
        console.log(resDataset)
      }

      project.set({
        status: 'reviewing'
      })

      // await project.save()
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
