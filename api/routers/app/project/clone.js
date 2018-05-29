const Route = require('lib/router/route')
const lov = require('lov')

const { Project } = require('models')
const cloneProject = require('queues/clone-project')

module.exports = new Route({
  method: 'post',
  path: '/clone/',
  validator: lov.object().keys({
    name: lov.string().required(),
    adjustment: lov.string()
  }),
  handler: async function (ctx) {
    var data = ctx.request.body

    const project = await Project.create({
      name: data.name,
      description: data.description,
      organization: ctx.state.organization._id,
      createdBy: ctx.state.user,
      status: 'cloning'
    })

    cloneProject.add({project1: data.clone, project2: project.uuid})

    ctx.body = {
      data: project
    }
  }
})
