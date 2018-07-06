// node tasks/engines/create-engine.js --name --description --path --instructions
require('../../config')
require('lib/databases/mongo')

const Task = require('lib/task')
const { Engine } = require('models')

const task = new Task(async function (argv) {
  console.log('Fetching existing Projects...')

  if (!argv.name) {
    console.log('Error: Name is required')
    return false
  }

  if (!argv.path) {
    console.log('Error: Path is required')
    return false
  }

  if (!argv.instructions) {
    console.log('Error: Instructions is required')
    return false
  }

  await Engine.create({
    name: argv.name,
    description: argv.description || null,
    path: argv.path,
    instructions: argv.instrucions
  })

  console.log(`Engine created!`)
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
