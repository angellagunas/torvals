const queues = require('./')
const { each } = require('lodash')
const config = require('../config')
const Raven = require('raven')

if (config.sentry.dsn) {
  const git = require('git-rev-sync')
  Raven.config(config.sentry.dsn, {release: git.long(), name: 'Queues'}).install()
}

each(queues, queue => {
  queue.run()
  queue.setCliLogger()
  queue.setCleanUp()
})
console.log(`Queues started`)
