const Route = require('lib/router/route')
const {Product, Organization} = require('models')
const parse = require('csv-parse/lib/sync')
const lov = require('lov')

module.exports = new Route({
  method: 'post',
  path: '/import',
  handler: async function (ctx) {
    const dataType = ctx.request.body.file.split(',')[0].split(';')[0]

    if (dataType !== 'data:text/csv') {
      ctx.throw(400, 'The file should be a CSV file!')
    }

    var buf = Buffer.from(ctx.request.body.file.split(',')[1], 'base64')
    var data = parse(buf.toString('utf-8'), {columns: true})

    const schema = lov.array().required().items(
      lov.object().keys({
        name: lov.string().required(),
        organizationSlug: lov.string().required(),
        description: lov.string().required(),
        category: lov.string().required(),
        subcategory: lov.string().required(),
        externalId: lov.string().required()
      })
    )

    let result = lov.validate(data, schema)

    if (result.error) {
      ctx.throw(400, result.error)
    }

    var created = 0
    var modified = 0

    for (var d of data) {
      let organization = await Organization.findOne({'slug': d.organizationSlug})
      if (organization) {
        d.organization = organization._id
        let product = await Product.findOne({'externalId': d.externalId, 'organization': organization._id})
        if (product) {
          product.set({
            name: d.name,
            description: d.description,
            category: d.category,
            subcategory: d.subcategory
          })
          await product.save()
          modified++
        } else {
          await Product.create(d)
          created++
        }
      }
    }

    ctx.body = {message: `Se han creado ${created} Productos y modificado ${modified} satisfactoriamente!`}
  }
})
