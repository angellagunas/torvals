// node tasks/migrations/add-organization-owner
require('../../config')
require('lib/databases/mongo')
const Task = require('lib/task')
const moment = require('moment')

const {Organization, User, Role} = require('models')

const task = new Task(async function (argv) {
  console.log('Running task =>', argv)

  const organizations = await Organization.find({
    accountOwner: {$exists: false}
  })

  for (let org of organizations) {
    const orgAdminRole = await Role.findOne({slug: 'orgadmin'})
    let orgAdmin = await User.findOne({'organizations.organization': org._id, 'organizations.role': orgAdminRole})
    let defaultOwner = await User.findOne({email: 'luis@commonsense.io'})

    if (orgAdmin) {
      org.set({
        accountOwner: orgAdmin._id
      })

      await org.save()
    } else if (defaultOwner) {
      defaultOwner.organizations.push({
        organization: org._id,
        role: orgAdminRole._id
      })

      await defaultOwner.save()

      org.set({
        accountOwner: defaultOwner._id
      })

      await org.save()
    }

    let owner = orgAdmin ? orgAdmin.name : 'Added new org admin - ' + defaultOwner.name
    console.log('********')
    console.log(' Organization: ' + org.name)
    console.log(' Owner: ' + owner)
  }

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
