import tree from '~core/tree'
import { testRoles } from '~base/tools'

const verifyRole = function (ctx, options) {
  let role = tree.get('role')
  if (!role) {
    ctx.redirect('/')
  }

  if (!testRoles(options.roles)) {
    ctx.redirect('/')
  }

  return true
}

module.exports = verifyRole
