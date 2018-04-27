const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')
const {SalesCenter} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/export/csv',
  handler: async function (ctx) {
    
    const salesCenter = await SalesCenter.find({'isDeleted':false}).populate('organization')

    var channelsCsv = ''

    for(var i = 0; i < salesCenter.length ; i++ ){
      channelsCsv += salesCenter[i].externalId + ',' + salesCenter[i].name + ',' + salesCenter[i].organization.name  + ',' + salesCenter[i].address + ',' + salesCenter[i].description + '\r\n'    }

    ctx.set('Content-disposition', 'attachment; filename=salesCenter.csv')
    ctx.set('Content-type', `text/csv`)

    ctx.body = channelsCsv
  }
})
