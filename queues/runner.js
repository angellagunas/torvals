const { each } = require('lodash')
const queues = require('./')

each(queues, queue => {
  queue.run()
  queue.setCliLogger()
  queue.setCleanUp()
})
console.log(`Queues started`)
