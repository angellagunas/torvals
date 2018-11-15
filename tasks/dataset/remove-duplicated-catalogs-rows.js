// node tasks/dataset/remove-duplicated-catalogs-rows.js  --org

require('../../config')
require('lib/databases/mongo')
const _ = require('lodash')

const Logger = require('lib/utils/logger')
const moment = require('moment')
const sendSlackNotificacion = require('tasks/slack/send-message-to-channel')
const Task = require('lib/task')
const { Anomaly, DataSetRow, Project, Organization } = require('models')

const task = new Task(
  async function (argv) {
    const log = new Logger('remove-duplicated-catalogs-in-rows')

    if (!argv.org) {
      throw new Error('You need to provide a organization!')
    }

    const batchSize = 10000
    log.call(`Start ==>  ${moment().format()}`)
    const org = await Organization.findOne({uuid: argv.org})
    const projects = await Project.find({
        isDeleted: false,
        organization: org._id
    })

    for(project of projects){
      try{
            log.call('migrating project => ' + project.uuid)
            const rows = await DataSetRow.aggregate([
              {'$match': {
                'catalogItems': {'$exists': true},
                project: project._id
              }}
            ]).allowDiskUse(true).cursor({batchSize: batchSize}).exec()

            while(await rows.hasNext()) {
              const row = await rows.next()
              try {
                  const catalogItems = Array.from(new Set(row.catalogItems.map( (item) => String(item) )))
                  if(catalogItems.length != row.catalogItems.length){
                      log.call('Updating catalogItems of ' + row.uuid)
                      await DataSetRow.update({_id: row._id}, {'$set': {'catalogItems': catalogItems}})
                  }
              } catch(e){
                  log.call(e)
                  continue
              }
          }
      }catch(e){
        log.call(e)
      }
    }
    log.call(`End ==> ${moment().format()}`)
    return true
  },
  async (argv) => {
    sendSlackNotificacion.run({
      channel: 'all',
      message: "Fixing catalog items in rows."
    })
  },
  async (argv) => {
    sendSlackNotificacion.run({
      channel: 'all',
      message: "The queue to fix the catalog items in anomales has finished."
    })
  }
)

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
