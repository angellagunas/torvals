const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')
const {Channel} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/export/csv',
  handler: async function (ctx) {
    
    const channels = await Channel.find({'isDeleted':false}).populate('organization')

    var channelsCsv = ''

    for(var i = 0; i < channels.length ; i++ ){
      channelsCsv += channels[i].externalId + ',' + channels[i].name + ',' + channels[i].organization.name + '\r\n'    }

    ctx.set('Content-disposition', 'attachment; filename=channels.csv')
    ctx.set('Content-type', `text/csv`)

    ctx.body = channelsCsv
  }
})
