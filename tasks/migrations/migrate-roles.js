// node tasks/migrations/migrate-roles.js
require('../../config')
require('lib/databases/mongo')
const moment = require('moment')
const slugify = require('underscore.string/slugify')

const Task = require('lib/task')
const { Role } = require('models')

const task = new Task(async function (argv) {
  console.log(`Start ==>  ${moment().format()}`)

  console.log('Fetching Roles...')
  let rolesInfo = [
    {
      'name': 'OrgAdmin',
      'isDefault': false,
      'priority': 1
    },
    {
      'name': 'Analyst',
      'isDefault': false,
      'priority': 2

    },
    {
      'name': 'Manager Level 3',
      'isDefault': true,
      'priority': 3
    },
    {
      'name': 'Consultor Level 3',
      'isDefault': false,
      'priority': 4

    },
    {
      'name': 'Manager Level 2',
      'isDefault': false,
      'priority': 5
    },
    {
      'name': 'Consultor Level 2',
      'isDefault': false,
      'priority': 6

    },
    {
      'name': 'Manager Level 1',
      'isDefault': true,
      'priority': 7
    }
  ]

  console.log('Changing consultor role ....')
  const consultor = await Role.findOne({
    name: 'Consultor',
    slug: 'consultor'
  })
  if (consultor) {
    consultor.set({
      name: 'Consultor Level 3',
      priority: 4,
      slug: slugify('Consultor Level 3')
    })
    await consultor.save()
  }

  console.log('Saving priority and roles ....')
  for (var role of rolesInfo) {
    const existingRole = await Role.findOne({
      name: role.name,
      slug: slugify(role.name)
    })

    if (!existingRole) {
      await Role.create({
        name: role.name,
        slug: slugify(role.name),
        priority: role.priority
      })
    } else {
      existingRole.set({
        priority: role.priority
      })
      await existingRole.save()
    }
  }

  console.log(`End ==>  ${moment().format()}`)

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
