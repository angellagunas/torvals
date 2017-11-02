const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')
const {User, Organization} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid',
  handler: async function (ctx) {
    
  }
})
