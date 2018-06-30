module.exports = async function (ctx, next) {
  if (!ctx.state.user) {
    ctx.throw(401, 'Invalid User')
  }

  await next()
}
