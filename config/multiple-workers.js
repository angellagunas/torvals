const os = require('os')

const numCPUs = os.cpus().length

module.exports = {
  multiple: process.env.MULTIPLE_WORKERS || false,
  numWorkers: process.env.NUM_WORKERS || numCPUs
}
