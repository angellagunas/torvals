const Route = require('lib/router/route')
const _ = require('lodash')

const {Project, DataSet} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid/columns',
  handler: async function (ctx) {
    var projectId = ctx.params.uuid
    var columns = []

    const project = await Project.findOne({'uuid': projectId, 'isDeleted': false}).populate('organization')
    ctx.assert(project, 404, 'Project not found')

    const datasets = await DataSet.find({_id: {$in: project.datasets.map(item => {
      return item.dataset
    })}})

    ctx.body = {
      data: _.intersection(...datasets.map(item => { return item.columns.map(c => {return c.name})}))
    }
  }
})
