const Route = require('lib/router/route')
const lov = require('lov')

const { DataSet, Project, Rule } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    name: lov.string().required(),
    description: lov.string(),
    project: lov.string().required()
  }),
  handler: async function (ctx) {
    const body = ctx.request.body
    let project

    project = await Project.findOne({uuid: body.project}).populate('rule')

    const rule = project.rule
    if (!rule) { ctx.throw(404, 'Reglas de negocio no definidas') }

    if (!project) {
      ctx.throw(404, 'Proyecto no encontrado')
    }

    const dataset = await DataSet.create({
      name: body.name,
      description: body.description,
      organization: ctx.state.organization._id,
      createdBy: ctx.state.user,
      project: project._id,
      rule: rule
    })

    project.datasets.push({
      dataset: dataset,
      columns: []
    })

    await project.save()

    dataset.rule = rule

    ctx.body = {
      data: dataset
    }
  }
})