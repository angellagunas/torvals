require('../../../config')

const { v4 } = require('uuid')
const neo4j = require('lib/databases/neo4j')
const Task = require('lib/task')
const Organization = require("models/neo4j/organization")


const task = new Task(
  async function (argv) {
    let log = (args) => {
      args = ('[save_dataset neo4j] ') + args
    }
    try {
      const session = neo4j.session();
      await Organization.create(session, {
        'uuid': v4(),
        'name': 'Barcel'
      })
        .then(org => {
          session.close()
          return true
        })
        .catch(function(error) {
          console.log(error)
          session.close()
          return false
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
