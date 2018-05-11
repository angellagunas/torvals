const Route = require('lib/router/route')
const {SalesCenter, Organization} = require('models')
const parse = require('csv-parse/lib/sync')
const lov = require('lov')

module.exports = new Route({
  method: 'post',
  path: '/import',
  handler: async function (ctx) {
    const dataType = ctx.request.body.file.split(',')[0].split(';')[0]

    if (dataType !== 'data:text/csv') {
      ctx.throw(400, '¡El archivo tiene que ser en formato csv!')
    }

    var buf = Buffer.from(ctx.request.body.file.split(',')[1], 'base64')
    var data = parse(buf.toString('utf-8'), {columns: true})

    const schema = lov.array().required().items(
      lov.object().keys({
        name: lov.string().required(),
        description: lov.string().required(),
        externalId: lov.string().required()
      })
    )

    let result = lov.validate(data, schema)

    if (result.error) {
      ctx.throw(400, result.error)
    }

    var modified = 0
    var created = 0

    for (var d of data) {
      let organization = await Organization.findOne({'_id': ctx.state.organization._id})
      if (organization) {
        d.organization = organization._id
        let salesCenter = await SalesCenter.findOne({'organization': ctx.state.organization._id, 'externalId': d.externalId})
        if (salesCenter) {
          salesCenter.set({
            name: d.name,
            description: d.description
          })
          await salesCenter.save()
          modified++
        } else {
          await SalesCenter.create(d)
          created++
        }
      }
    }

    ctx.body = {message: `Se han creado ${created} Centros de venta y modificado ${modified} satisfactoriamente!`}
  }
})
