import tree from '~core/tree'

function testRoles (roles) {
  if (!roles) return true
  let rolesList = roles.split(',')
  let currentRole = tree.get('role')
  let test = false

  for (var role of rolesList) {
    role = role.trim()
    if (role && currentRole && currentRole.slug === role) {
      test = true
    }
  }

  return test
}

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
