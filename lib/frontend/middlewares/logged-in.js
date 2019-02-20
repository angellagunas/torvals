import tree from '~core/tree'
import cookies from '~base/cookies'

const loggedIn = function (ctx) {
  if (!tree.get('loggedIn')) {
  	cookies.remove('jwt')
    ctx.redirect('/log-in')
  }

  return true
}

module.exports = loggedIn
