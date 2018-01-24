import tree from '~core/tree'

const loggedIn = function (ctx) {
  if (!tree.get('loggedIn')) {
    ctx.redirect('/landing')
  }

  return true
}

module.exports = loggedIn
