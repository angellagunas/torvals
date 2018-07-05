const Route = require('lib/router/route')
const {Project, Cycle, Organization, Rule} = require('models')
const moment = require('moment')

module.exports = new Route({
  method: 'get',
  path: '/filters/cycles/:uuid',
  handler: async function (ctx) {
    const organization = await Organization.findOne({_id: ctx.state.organization._id})
    const uuid = ctx.params.uuid

    const project = await Project.findOne({
      uuid: uuid,
      organization: organization._id
    })

    const rule = await Rule.findOne({
      organization: organization._id,
      _id: project.rule
    })

    const cycles = await Cycle.find({
      isDeleted: false,
      'organization': organization._id,
      rule: rule._id,
      $or: [
        {
          dateStart: {
            $gte: moment().utc().format('YYYY-MM-DD')
          }
        },
        {
          dateStart: {
            $lte: moment().utc().format('YYYY-MM-DD')
          },
          dateEnd: {
            $gte: moment().utc().format('YYYY-MM-DD')
          }
        }
      ]

    }).sort({dateStart: 1}).limit(rule.cyclesAvailable)

    cycles.data = cycles.map((item) => {
      return item.toPublic()
    })

    ctx.body = {
      cycles: cycles.data
    }
  }
})
