const url = require('url')

const { Organization, UserToken, User } = require('models')
const { server } = require('config')
const jwt = require('lib/jwt')

module.exports = async function (ctx, next) {
  ctx.state.appHost = server.appHost
  ctx.state.apiHost = server.apiHost
  let pathname = url.parse(ctx.request.url).pathname

  if (ctx.req.headers.authorization) {
    const [ method, token ] = ctx.req.headers.authorization.split(' ')

    if (method === 'Bearer') {
      let data
      try {
        data = await jwt.verify(token)
      } catch (e) {
        ctx.throw(401, 'Invalid JWT')
      }

      let userToken = await UserToken.findOne({
        key: data.key,
        secret: data.secret,
        isDeleted: { $ne: true }
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

      let user = userToken.user
      user = await User.populate(
        user,
        ['organizations.role', 'organizations.organization']
      )

      ctx.state.user = user
      ctx.state.token = userToken
      ctx.state.authMethod = 'Bearer'
    }

    if (method === 'Basic') {
      const decodedStr = Buffer.from(token, 'base64').toString('ascii')

      const key = decodedStr.split(':')[0]
      const secret = decodedStr.split(':')[1]

      userToken = await UserToken.findOne({
        key: key,
        secret: secret,
        isDeleted: {$ne: true}
      }).populate('user')

      if (!userToken) {
        return ctx.throw(401, 'Invalid User')
      }

      if (!userToken.user) {
        return ctx.throw(401, 'Invalid User')
      }

      let user = userToken.user
      user = await User.populate(
        user,
        ['organizations.role', 'organizations.organization']
      )

      ctx.state.user = user
      ctx.state.token = userToken
      ctx.state.authMethod = 'Basic'
    }
  }

  let originalHost
  if (ctx.request.headers['referer']) {
    originalHost = ctx.request.headers['referer']
  } else if (ctx.request.headers.host) {
    originalHost = ctx.request.headers.host
  } else if (ctx.request.headers.origin) {
    originalHost = ctx.request.headers.origin
  }

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
