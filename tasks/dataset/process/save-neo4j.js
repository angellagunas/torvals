require('../../../config')

const { v4 } = require('uuid')
const neo4j = require('lib/databases/neo4j')
const Task = require('lib/task')
var model = require('seraph-model');


const task = new Task(
  async function (argv) {
    let log = (args) => {
      args = ('[save_dataset neo4j] ') + args
    }
    var Dataset = model(neo4j, 'Datasets');
    try {
      Dataset.save({ name: 'Jon', city: 'Bergen', uuid: v4() }, function(err, saved) {
        console.log('SAVED!')
        console.log(saved)
        console.log(err)
      })
    } catch(error) {
      console.log(error)
    }

    return true
  },
  async (argv) => {
    // Before task
  },
  async (argv) => {
    // After task
  }
)

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
