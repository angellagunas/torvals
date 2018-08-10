const Route = require('lib/router/route')
const { User, ForecastGroup } = require('models')
const sendEmail = require('tasks/emails/send-email')

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

    let users = data.users.split(',')
    users = await User.find({
      email: { $in: users }
    })
    
    let url = process.env.APP_HOST
    let base = url.split('://')
    base[1].replace('wwww', '')
    url = `${base[0]}://${forecastGroup.project.organization.slug}.${base[1]}`

    const dataMail = {
      url: `${url}/forecast/detail/${forecastGroup.uuid}`,
      base: url
    }

    const recipients = {
      recipient: users.map(item => {
        return {email: item.email, name: item.name}
      })
    }

    sendEmail.run({
      recipients,
      args: dataMail,
      template: 'reset-password',
      title: 'Se ha compartido una predicción.'
    })

    ctx.body = recipients
  }
})
