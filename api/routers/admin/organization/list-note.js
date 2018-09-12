const Route = require('lib/router/route')

const {Note, Organization} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid/notes',
  handler: async function (ctx) {
    const orgUuid = ctx.params.uuid

    const org = await Organization.findOne({'uuid': orgUuid})
    ctx.assert(org, 404, 'Organization not found')

    const notes = await Note.find({
      organization: org._id,
      isDeleted: false
    }).populate('user organization')

    ctx.body = notes
  }
})
