const url = require('url')

const { User, Organization } = require('models')
const { server } = require('config')
const jwt = require('lib/jwt')

module.exports = async function (ctx, next) {
  ctx.state.appHost = server.appHost
  ctx.state.apiHost = server.apiHost

  if (ctx.req.headers.authorization) {
    const [ method, token ] = ctx.req.headers.authorization.split(' ')

    if (method === 'Bearer') {
      var data
      try {
        data = await jwt.verify(token)
      } catch (e) {
        ctx.throw(401, 'Invalid JWT')
      }

      let user = await User.findOne({
        uuid: data.uuid,
        apiToken: data.apiToken
      }).populate('organizations.role').populate('organizations.organization')

      if (!user) {
        ctx.throw(401, 'Invalid User')
      }

      ctx.state.user = user
    }
  }

  if (ctx.request.headers.origin) {
    const origin = url.parse(ctx.request.headers.origin)

    const host = origin.hostname.split('.')

    if (host.length === 3 && host[0] !== 'www') {
      ctx.state.orgSlug = host[0]

      if (ctx.state.orgSlug) {
        const organization = await Organization.findOne({slug: ctx.state.orgSlug})

        if (!organization || organization.isDeleted) {
          ctx.throw(401, 'Organization not found')
        }

        ctx.state.organization = organization
      }
    }
  }

  await next()
}
