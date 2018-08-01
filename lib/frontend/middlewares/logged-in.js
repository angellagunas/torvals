import tree from '~core/tree'
import cookies from '~base/cookies'

const loggedIn = function (ctx) {
  if (!tree.get('loggedIn')) {
  	cookies.remove('jwt')
    cookies.remove('organization')
    ctx.redirect('/landing')
  }

  return true
}

module.exports = loggedIn