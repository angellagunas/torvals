const { Channel } = require('models')
const { channelsFixture } = require('../fixtures')

module.exports = function createChannel (opts = {}) {

  for (var i in channelsFixture) {
    const channel = channelsFixture[i]
    Channel.create(Object.assign({}, channel, opts))
  }

  return Channel.find()
}
