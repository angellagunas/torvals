// node tasks/migrations/add-field-priority-to-roles
require('../../config')
const connection = require('lib/databases/mongo')
const {Role} = require('models')

var addPriorityRoles = async function () {
  var rolesPriority = [
    {slug: 'orgadmin', priority: 1},
    {slug: 'analyst', priority: 2},
    {slug: 'consultor', priority: 3},
    {slug: 'manager-level-2', priority: 4},
    {slug: 'manager-level-1', priority: 5}
  ]

  for (var role of rolesPriority) {
    var roleObj = await Role.findOne({slug: role.slug})
    if (roleObj) {
      roleObj.set({priority: role.priority})
      await roleObj.save()
      console.log('Done ' + role.slug + ' changed priority to ' + role.priority)
    }
  }
  console.log('All done! Bye!')
  connection.close()
}

if (require.main === module) {
  addPriorityRoles()
} else {
  module.exports = addPriorityRoles
}
