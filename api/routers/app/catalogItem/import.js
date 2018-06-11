const Route = require('lib/router/route')
const parse = require('csv-parse/lib/sync')
const lov = require('lov')
const { CatalogItem, Organization, Rule } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/import',
  handler: async function (ctx) {
    const dataType = ctx.request.body.file.split(',')[0].split(';')[0]
    const type = ctx.request.body.type

    if (!type) {
      ctx.throw(400, 'No Catalog supplied')
    }

    var organization = ctx.state.organization._id
    const org = await Organization.findOne({
      '_id': organization,
      'isDeleted': false
    })
    ctx.assert(org, 404, 'Organización no encontrada')

    const rule = await Rule.findOne({
      'organization': org._id,
      'isCurrent': true,
      'isDeleted': false
    })
    ctx.assert(rule, 404, 'Reglas no encontradas')

    const findCatalog = rule.catalogs.find(item => { return item === data.type })

    if (!findCatalog) {
      ctx.throw(404, 'Catálogo no encontrado')
    }

    if (dataType === 'data:') {
      const fileName = ctx.request.body.file.split(',')[0].split(';')[1]
      const ext = fileName.slice((fileName.lastIndexOf('.') - 1 >>> 0) + 2)
      if (ext !== 'csv') {
        ctx.throw(400, '¡El archivo tiene que ser en formato csv!')
      }
    } else if (dataType !== 'data:text/csv') {
      ctx.throw(400, '¡El archivo tiene que ser en formato csv!')
    }

    var buf = Buffer.from(ctx.request.body.file.split(',')[1], 'base64')
    var data = parse(buf.toString('utf-8'), {columns: true})

    const schema = lov.array().required().items(
      lov.object().keys({
        name: lov.string().required(),
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
      let organization = await Organization.findOne({'_id': ctx.state.organization._id})

      if (organization) {
        d.organization = organization._id
        d.type = type
        let item = await CatalogItem.findOne({
          'externalId': d.externalId,
          'organization': ctx.state.organization._id,
          'type': type
        })

        if (item) {
          item.set({
            name: d.name
          })

          await item.save()

          modified++
        } else {
          await CatalogItem.create(d)

          created++
        }
      }
    }

    ctx.body = {message: `¡Se han creado ${created} y modificado ${modified} objetos satisfactoriamente!`}
  }
})
