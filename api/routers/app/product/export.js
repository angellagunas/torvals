const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')
const {Product} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/export/csv',
  handler: async function (ctx) {
    
    const products = await Product.find({'isDeleted':false}).populate('organization')

    var productsCsv = ''

    for(var i = 0; i < products.length ; i++ ){
      productsCsv += products[i].externalId + ',' + products[i].name + ',' + products[i].organization.name + '\r\n'
    }

    ctx.set('Content-disposition', 'attachment; filename=products.csv')
    ctx.set('Content-type', `text/csv`)

    ctx.body = productsCsv
  }
})
