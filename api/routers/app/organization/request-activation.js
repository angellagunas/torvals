const Route = require('lib/router/route')
const lov = require('lov')
const sendRequestActivation = require('tasks/emails/send-request-activation')
const notificationRequestActivation = require('tasks/emails/notification-request-activation')

const {Organization, User} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/request-activation',
  handler: async function (ctx) {
    var organizationId = ctx.params.uuid
    var data = ctx.request.body

    const org = await Organization.findOne({'uuid': organizationId, 'isDeleted': false, $or: [{status: 'trial'}, {status: 'inactive'}]})
    ctx.assert(org, 404, 'Organización no encontrada')

    const owner = await User.findOne({'organizations.organization': org._id, accountOwner: true})
    ctx.assert(owner, 400, 'La organización no cuenta con un dueño.')

    await sendRequestActivation.run({
      uuid: owner.uuid,
      name: owner.name,
      email: owner.email,
      organization: org.name
    })

    await notificationRequestActivation.run({
      owner: owner,
      organization: org,
      admins: [
        {
          name: 'Jon Corona',
          email: 'jon@commonsense.io'
        }
      ]
    })

    ctx.body = {success: true}
  }
})
