module.exports = function roleMiddleware (slug) {
  return async function (ctx, next) {
    if (!ctx.state.user || ctx.state.user.role.slug !== slug) {
      ctx.throw(403, 'Unauthorized User, invalid role')
    }

    await next()
  }
}
