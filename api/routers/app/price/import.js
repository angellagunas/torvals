const Route = require('lib/router/route')
const {Rule, Price, CatalogItem} = require('models')
const parse = require('csv-parse/lib/sync')
const lov = require('lov')

module.exports = new Route({
  method: 'post',
  path: '/import',
  handler: async function (ctx) {
    const dataType = ctx.request.body.file.split(',')[0].split(';')[0]

    if (dataType === 'data:' || dataType === 'data:text/plain') {
      const fileName = ctx.request.body.file.split(',')[0].split(';')[1]
      const ext = fileName.slice((fileName.lastIndexOf('.') - 1 >>> 0) + 2)
      if (ext.toLowerCase() !== 'csv') {
        ctx.throw(400, '¡El archivo tiene que ser en formato csv!')
      }
    } else if (dataType !== 'data:text/csv') {
      ctx.throw(400, '¡El archivo tiene que ser en formato csv!')
    }

    let buf = Buffer.from(ctx.request.body.file.split(',')[1], 'base64')
    let data = parse(buf.toString('utf-8'), {columns: true})

    const schema = lov.array().required().items(
      lov.object().keys({
        productExternalId: lov.string().required(),
        price: lov.string().required()
      })
    )

    let result = lov.validate(data, schema)

    if (result.error) {
      ctx.throw(400, '¡El id del producto y el precio son requeridos!')
    }

    const rule = await Rule.findOne({
      'isCurrent': true,
      'isDeleted': false,
      'organization': ctx.state.organization._id
    }).populate('catalogs')

    let productCatalog = rule.catalogs.find(item => { return item.slug === 'producto' })

    let created = 0
    let existing = 0
    let error = 0
    for (let d of data) {
      let product = await CatalogItem.findOne({
        'externalId': d.productExternalId,
        isDeleted: false,
        catalog: productCatalog._id
      })

      if (product) {
        let catalogItems = []
        let allCatalogs = true
        for (let a of rule.catalogs) {
          if (a.slug === 'producto') continue
          if (d[`${a.slug}-externalId`]) {
            let cItem = await CatalogItem.findOne({
              externalId: d[`${a.slug}-externalId`],
              catalog: a._id,
              organization: ctx.state.organization._id
            })

            if (!cItem) {
              allCatalogs = false
            }

            catalogItems.push(cItem)
          } else {
            allCatalogs = false
          }
        }

        if (!allCatalogs) {
          error++
          continue
        }

        let price = await Price.findOne({
          product: product._id,
          catalogItems: catalogItems,
          organization: ctx.state.organization._id
        })

        if (price) {
          price.set({price: d.price})
          await price.save()
          existing++
        } else {
          price = await Price.create({
            product: product._id,
            catalogItems: catalogItems,
            organization: ctx.state.organization._id,
            price: d.price
          })

          created++
        }
      } else {
        error++
      }
    }

    let existingMessage = ''
    if (existing) {
      existingMessage = ` Otros ${existing} precios ya existían y se actualizaron.`
    }

    let errorMessage = ''
    if (error) {
      errorMessage = ` ${error} precios no se guardaron ya que no contaban con todos los catálogos.`
    }

    ctx.body = {message: `¡Se han creado ${created} precios satisfactoriamente!${errorMessage}${existingMessage}`}
  }
})
