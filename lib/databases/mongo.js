const mongoose = require('mongoose')
const config = require('config/database')

mongoose.Promise = global.Promise
mongoose.connect(config.mongo.url, {
  useMongoClient: true,
  connectTimeoutMS: 600000,
  socketTimeoutMS: 600000
})

module.exports = mongoose.connection
