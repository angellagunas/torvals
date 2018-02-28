const url = require('url')

const { UserToken, Organization, User } = require('models')
const { server } = require('config')
const jwt = require('lib/jwt')

module.exports = async function (ctx, next) {
  ctx.state.appHost = server.appHost
  ctx.state.apiHost = server.apiHost
  var pathname = url.parse(ctx.request.url).pathname

  if (ctx.req.headers.authorization) {
    const [ method, token ] = ctx.req.headers.authorization.split(' ')

    if (method === 'Bearer') {
      var data
      try {
        data = await jwt.verify(token)
      } catch (e) {
        ctx.throw(401, 'Invalid JWT')
      }

      let userToken = await UserToken.findOne({
        key: data.key,
        secret: data.secret
      }).populate('user')

      if (!userToken) {
        return ctx.throw(401, 'Invalid User')
      }

      if (!userToken.user) {
        return ctx.throw(401, 'Invalid User')
      }

      if (userToken.user.isDeleted) {
        return ctx.throw(401, 'Invalid User')
      }

      var user = userToken.user
      user = await User.populate(
        user,
        ['organizations.role', 'organizations.organization']
      )

      ctx.state.user = user
      ctx.state.token = userToken

      userToken.lastUse = new Date()
      await userToken.save()
    }
  }

  let originalHost
  if (ctx.request.headers['referer']) {
    originalHost = ctx.request.headers['referer']
  } else if (ctx.request.headers.origin) {
    originalHost = ctx.request.headers.origin
  }

  console.log('=>', ctx.request.headers, server.apiHost)
  if (originalHost && !pathname.includes('login')) {
    const origin = url.parse(originalHost)
    const apiHostname = url.parse(server.apiHost).hostname.split('.')

    const host = origin.hostname.split('.')

    if (host.length > apiHostname.length && host[0] !== 'www') {
      ctx.state.orgSlug = host[0]

      if (ctx.state.orgSlug) {
        const organization = await Organization.findOne({slug: ctx.state.orgSlug, isDeleted: false})

        if (!organization) {
          ctx.throw(401, 'Organization not found')
        }

        ctx.state.organization = organization
      }
    }
  }

  await next()
}
