const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')
const {Price} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/export/csv',
  handler: async function (ctx) {
    
    const prices = await Price.find({'isDeleted':false}).populate('organization').populate('product').populate('channel')

    var priceCsv = ''

    for(var i = 0; i < prices.length ; i++ ){
      priceCsv += prices[i].externalId + ',' + prices[i].name + ',' + prices[i].organization.name  + ',' + prices[i].product.name + ',' + prices[i].price + '\r\n'    

    }

    ctx.set('Content-disposition', 'attachment; filename=Prices.csv')
    ctx.set('Content-type', `text/csv`)

    ctx.body = priceCsv
  }
})
