const Route = require('lib/router/route')
const {Channel, Organization} = require('models')
const parse = require('csv-parse/lib/sync')
const lov = require('lov')

module.exports = new Route({
  method: 'post',
  path: '/import',
  handler: async function (ctx) {
    const dataType = ctx.request.body.file.split(',')[0].split(';')[0]

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
        organizationSlug: lov.string().required(),
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
      let organization = await Organization.findOne({'slug': d.organizationSlug})
      if (organization) {
        d.organization = organization._id
        let channel = await Channel.findOne({'externalId': d.externalId, 'organization': organization._id})
        if (channel) {
          channel.set({
            name: d.name
          })
          await channel.save()
          modified++
        } else {
          await Channel.create(d)
          created++
        }
      }
    }

    ctx.body = {message: `¡Se han creado ${created} Canales y modificado ${modified} satisfactoriamente!`}
  }
})
