const Route = require('lib/router/route')
const {User, ForecastGroup} = require('models')
const Mailer = require('lib/mailer')

module.exports = new Route({
  method: 'post',
  path: '/share/:uuid',
  handler: async function (ctx) {
    const data = ctx.request.body
    const uuid = ctx.params.uuid
    const forecastGroup = await ForecastGroup.findOne({uuid: uuid}).populate({
      path: 'project',
      populate: {path: 'organization'}
    })
    ctx.assert(forecastGroup, 404, 'ForecastGroup no encontrado')

    const users = await User.find({uuid: {$in: data.users}})
    const email = new Mailer('share-forecast')
    let url = process.env.APP_HOST
    let base = url.split('://')
    base[1].replace('wwww', '')
    url = base[0] + '://' + forecastGroup.project.organization.slug + '.' + base[1]
    let dataMail = {url: url + '/forecast/detail/' + forecastGroup.uuid, base: url}
    await email.format(dataMail)

    let recipients = {
      recipient: users.map(item => {
        return {email: item.email, name: item.name}
      })
    }

    await email.send({
      ...recipients,
      title: 'Se ha compartido una predicción'
    })

    ctx.body = recipients
  }
})
