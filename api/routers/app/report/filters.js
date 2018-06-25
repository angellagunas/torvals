const Route = require('lib/router/route')
const {Project, User, Cycle, Organization, CatalogItem, Rule} = require('models')
const moment = require('moment')

module.exports = new Route({
  method: 'get',
  path: '/filters/',
  handler: async function (ctx) {
    const organization = await Organization.findOne({_id: ctx.state.organization._id})

    const projects = await Project.find({
      isDeleted: false,
      mainDataset: {$ne: null},
      organization: organization._id
    })
    projects.data = projects.map((item) => {
      return item.toPublic()
    })

    const users = await User.find({
      isDeleted: false,
      'organizations.organization': organization._id
    })
    users.data = users.map((item) => {
      return item.toPublic()
    })

    const rule = await Rule.findOne({
      organization: organization._id,
      isCurrent: true,
      isDeleted: false
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

    }).sort({dateStart: 1})

    cycles.data = cycles.map((item) => {
      return item.toPublic()
    })

    const catalogItems = await CatalogItem.find({
      isDeleted: false,
      organization: organization._id,
      type: {$nin: ['producto', 'productos']}
    }).populate('organization')
    catalogItems.data = catalogItems.map((item) => {
      return item.toPublic()
    })

    ctx.body = {
      projects: projects.data,
      users: users.data,
      cycles: cycles.data,
      catalogItems: catalogItems.data
    }
  }
})
