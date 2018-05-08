const Route = require('lib/router/route')
const {User, Role, Project} = require('models')
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
        email: lov.string().required(),
        password: lov.string().required(),
        name: lov.string().required(),
        screenName: lov.string().required(),
        roleSlug: lov.string().required()
      })
    )

    let result = lov.validate(data, schema)

    if (result.error) {
      ctx.throw(400, result.error)
    }
    var created = 0
    for (var d of data) {
      let user = await User.findOne({'email': d.email})
      if (!user) {
        let role = await Role.findOne({'slug': d.roleSlug})
        if (role) {
          if (d.roleSlug === 'manager-level-1') {
            let project = await Project.findOne({'externalId': d.projectExternalId})
            if (project) {
              await User.create({
                email: d.email,
                password: d.password,
                name: d.name,
                screenName: d.screenName,
                organizations: [{organization: ctx.state.organization._id, role: role._id, defaultProject: project._id}]
              })
              created++
            }
          } else {
            await User.create({
              email: d.email,
              password: d.password,
              name: d.name,
              screenName: d.screenName,
              organizations: [{organization: ctx.state.organization._id, role: role._id}]
            })
            created++
          }
        }
      }
    }

    ctx.body = {message: `Se han creado ${created} usuarios satisfactoriamente!`}
  }
})
