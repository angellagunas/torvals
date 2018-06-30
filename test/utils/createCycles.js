const { Cycle } = require('models')
const { cyclesFixture } = require('../fixtures')

module.exports = function createCycles (opts = {}) {

  for (var i in cyclesFixture) {
    const cycle = cyclesFixture[i]
    Cycle.create(Object.assign({}, cycle, opts))
  }

  return Cycle.find()
}
