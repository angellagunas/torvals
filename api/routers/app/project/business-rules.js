const lov = require('lov')
const updateRules = require('queues/clone-update-rules-main-dataset')
const Route = require('lib/router/route')

const { Project, Rule } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/update/businessRules',
  validator: lov.object().keys({
    uuid: lov.string().required()
  }),
  handler: async function (ctx) {
    const data = ctx.request.body

    if (!data.uuid) {
      throw new Error('You need to provide an uuid!')
    }
    const project = await Project.findOne({
      'uuid': data.uuid,
      'isDeleted': false
    }).populate('mainDataset').populate('datasets.dataset')
    ctx.assert(project, 404, 'Proyecto no encontrado')

    const rule = await Rule.findOne({
      'isCurrent': true,
      'isDeleted': false,
      'organization': ctx.state.organization._id
    })

    if (project.status === 'empty') {
      project.set({
        outdated: false,
        rule: rule
      })

      for (let dataset of project.datasets) {
        dataset = dataset.dataset
        let status = dataset.status

        if (dataset.status === 'reviewing' || dataset.status === 'processing') {
          status = 'configuring'
        }

        let newCols = dataset.columns

        for (let col of newCols) {
          for (let key of Object.keys(col)) {
            if (key === 'name') continue
            col[key] = false
          }
        }

        dataset.set({
          rule: rule,
          status: status,
          columns: newCols
        })

        await dataset.save()
      }

      await project.save()

      ctx.body = {
        data: project
      }

      return
    }

    project.set({
      outdated: false,
      status: 'updating-rules',
      rule: rule
    })

    await project.save()

    updateRules.add({
      uuid: project.uuid
    })

    ctx.body = {
      data: project
    }
  }
})
