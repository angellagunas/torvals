const Route = require('lib/router/route')
const _ = require('lodash')

const {Project} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid',
  handler: async function (ctx) {
    var projectId = ctx.params.uuid

    // Check user role for the organization
    const organizationKey = _.findKey(ctx.state.user.organizations, { 'organization': {'_id': ctx.state.organization._id} })
    const organization = ctx.state.user.organizations[organizationKey]
    if (organization.role.slug === 'manager-level-1') {
      // is manager level 1, show default project
      const defaultProject = await Project.findOne({ '_id': organization.defaultProject })
      projectId = defaultProject.uuid
    }

    const project = await Project.findOne({
      'uuid': projectId,
      'isDeleted': false,
      'organization': ctx.state.organization._id
    }).populate('organization')
    .populate('activeDataset')
    .populate('rule')
    .populate('mainDataset')

    ctx.assert(project, 404, 'Proyecto no encontrado')

    await project.rule.populate({ path: 'catalogs', options: {sort: {'slug': 1}} }).execPopulate()

    ctx.body = {
      data: project.toPublic()
    }
  }
})
