// node tasks/anomalies/remove-duplicated-catalogs-anomalies.js

require('../../config')
require('lib/databases/mongo')
const _ = require('lodash')

const Logger = require('lib/utils/logger')
const moment = require('moment')
const sendSlackNotificacion = require('tasks/slack/send-message-to-channel')
const Task = require('lib/task')
const { Anomaly } = require('models')

const task = new Task(
  async function (argv) {
    const log = new Logger('remove-duplicated-catalogs-in-anomalies')
    const batchSize = 10000
    log.call(`Start ==>  ${moment().format()}`)

    const anomalies = await Anomaly.find({'catalogItems': {'$exists': true}}).cursor()

    for (let anomaly = await anomalies.next(); anomaly != null; row = await anomalies.next()) {
      try {
        const catalogItems = Array.from(Set(anomaly.catalogItems))

        if(catalogItems.length != anomaly.catalogItems.length){
          log.call('Updating catalogItems of ' + anomaly.uuid)
          await Anomaly.update({'_id': anomaly._id}, {catalogItems: catalogItems})
        }
      } catch(e){
        log.call(e)
        continue
      }
    }

    log.call(`End ==> ${moment().format()}`)
    return true
  },
  async (argv) => {
    sendSlackNotificacion.run({
      channel: 'all',
      message: "Fixing catalog items in anomalies."
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
