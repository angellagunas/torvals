module.exports = async function (ctx, next) {
  if (!ctx.state.user) {
    ctx.throw(401, 'Invalid User')
  }

  if (!ctx.state.user.isAdmin) {
    ctx.throw(403, 'Invalid User, not admin')
  }

  await next()
}
