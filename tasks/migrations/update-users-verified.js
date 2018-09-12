// node tasks/migrations/update-users-verified
require('../../config')
require('lib/databases/mongo')
const Task = require('lib/task')

const {User} = require('models')

const task = new Task(async function (argv) {
  console.log('Running task =>', argv)

  const fromInactivateUsers = await User.count({isVerified: {$exists: false}})
  console.log('From =>', fromInactivateUsers)

  await User.update(
    {isVerified: {$exists: false}},
    {isVerified: true},
    {multi: true}
  )

  const toActivateUsers = await User.count({isVerified: true})

  console.log('To =>', toActivateUsers)
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
