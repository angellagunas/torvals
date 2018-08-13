const Route = require('lib/router/route')
const {Group, Rule, Project, CatalogItem} = require('models')
const parse = require('csv-parse/lib/sync')
const lov = require('lov')
const crypto = require('crypto')
const slugify = require('underscore.string/slugify')

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

    let buf = Buffer.from(ctx.request.body.file.split(',')[1], 'base64')
    let data = parse(buf.toString('utf-8'), {columns: true})

    const schema = lov.array().required().items(
      lov.object().keys({
        name: lov.string().required()
      })
    )

    let result = lov.validate(data, schema)

    if (result.error) {
      ctx.throw(400, 'El nombre del grupo es requerido!')
    }

    const rule = await Rule.findOne({
      'isCurrent': true,
      'isDeleted': false,
      'organization': ctx.state.organization._id
    }).populate('catalogs')

    let created = 0
    let existing = 0
    let projectError = 0
    for (let d of data) {
      let group = await Group.findOne({'name': d.name})
      if (!group) {
        d.slug = slugify(d.name)
        d.organization = ctx.state.organization
        group = Group.create(d)

        for (let a of rule.catalogs) {
          if (a.slug === 'producto') continue
          if (d[`${a.slug}-external-id`]) {
            let cItem = CatalogItem.findOne({externalId: [`${a.slug}-external-id`]})
          }
        }
      } else {
        let actualOrg = user.organizations.find(item => {
          return String(item.organization._id) === String(ctx.state.organization._id)
        })

        if (!actualOrg) {
          let role = await Role.findOne({'slug': slugify(d.role)})
          if (role) {
            let data = {
              organization: ctx.state.organization._id,
              role: role._id
            }

            if (role.slug === 'manager-level-1') {
              let project = await Project.findOne({'uuid': d.projectId})
              if (project) {
                data.defaultProject = project._id
              } else {
                projectError++
                continue
              }
            }

            user.organizations.push(data)
            user.markModified('organizations')
            user.save()
            created++
          }
        } else {
          existing++
        }
      }
    }

    let projectMessage = ''

    if (projectError) {
      projectMessage = `, Ha ocurrido un error con ${projectError} usuarios: Proyecto inválido.`
    }

    let existingMessage = ''
    if (existing) {
      existingMessage = ` Otros ${existing} usuarios ya existían y no se modificaron.`
    }

    ctx.body = {message: `¡Se han creado ${created} usuarios satisfactoriamente!${projectMessage}${existingMessage}`}
  }
})
