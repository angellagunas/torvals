const Route = require('lib/router/route')
const {User, Role, Project} = require('models')
const parse = require('csv-parse/lib/sync')
const lov = require('lov')
const crypto = require('crypto')
const slugify = require('underscore.string/slugify')

module.exports = new Route({
  method: 'post',
  path: '/import',
  handler: async function (ctx) {
    const dataType = ctx.request.body.file.split(',')[0].split(';')[0]
    const sendEmail = ctx.request.body.sendEmail

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
        email: lov.string().required(),
        password: lov.string(),
        name: lov.string().required(),
        role: lov.string().required()
      })
    )

    let result = lov.validate(data, schema)

    if (result.error) {
      ctx.throw(400, result.error)
    }
    let created = 0
    let existing = 0
    let projectError = 0
    for (let d of data) {
      let user = await User.findOne({'email': d.email})
      if (!user) {
        if (!d.password || sendEmail) {
          d.password = crypto.randomBytes(15).toString('base64')
        }

        let role = await Role.findOne({'slug': slugify(d.role)})
        if (role) {
          if (role.slug === 'manager-level-1') {
            let project = await Project.findOne({'uuid': d.projectId})
            if (project) {
              let user = await User.create({
                email: d.email,
                password: d.password,
                name: d.name,
                screenName: d.name,
                organizations: [{
                  organization: ctx.state.organization._id,
                  role: role._id,
                  defaultProject: project._id
                }]
              })
              created++

              if (sendEmail) {
                await user.sendInviteEmail()
              }
            } else {
              projectError++
            }
          } else {
            let user = await User.create({
              email: d.email,
              password: d.password,
              name: d.name,
              screenName: d.name,
              organizations: [{organization: ctx.state.organization._id, role: role._id}]
            })

            if (sendEmail) {
              await user.sendInviteEmail()
            }

            created++
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
