const queues = require('./')
const { each } = require('lodash')

each(queues, queue => { queue.run() })
