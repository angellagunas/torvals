const Route = require('lib/router/route')
const lov = require('lov')
const { Price } = require('models')
const Api = require('lib/abraxas/api')
const request = require('lib/request')
const verifyPrices = require('queues/update-prices')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    price: lov.number().required()
  }),
  handler: async function (ctx) {
    var priceId = ctx.params.uuid
    var data = ctx.request.body
    var apiData

    const price = await Price.findOne({'uuid': priceId, 'isDeleted': false}).populate('organization')
    ctx.assert(price, 404, 'Price not found')

    price.set({price: data.price})

    await price.save()

    // patch abraxas api
    try {
      await Api.fetch()
      apiData = Api.get()
    } catch (e) {
      ctx.throw(401, 'Falló al conectar con la api (Abraxas)')

      return false
    }

    var options = {
      url: `${apiData.hostname}${apiData.baseUrl}/prices/organizations/all`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiData.token}`,
        'If-Match': `${price.etag}`
      },
      body: {
        _id: price.externalId,
        price: data.price
      },
      json: true,
      persist: true
    }

    var res = await request(options)
    if (res.status === 'ok') {
      data.patch = res._status
      verifyPrices.add({uuid: price.organization.uuid})
    } else {
      ctx.throw(401, 'Error al actualizar precio (Abraxas)')
    }

    ctx.body = {
      data: price.toAdmin()
    }
  }
})
