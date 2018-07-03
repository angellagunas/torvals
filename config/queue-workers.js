const os = require('os')

const numCPUs = os.cpus().length

module.exports = {
  multiple: process.env.MULTIPLE_QUEUE_WORKERS === 'true',
  numWorkers: parseInt(process.env.NUM_QUEUE_WORKERS) || numCPUs
}
