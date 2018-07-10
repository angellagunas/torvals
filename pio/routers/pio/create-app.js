const lov = require('lov')
const Route = require('lib/router/route')
const createApp = require('queues/pio-create-app')

module.exports = new Route({
  method: 'post',
  path: '/create',
  validator: lov.object().keys({
    uuid: lov.string().required()
  }),
  handler: async function (ctx) {
    var data = ctx.request.body

    createApp.add({
      path: '/engines/poisson_regression',
      name: 'REMOTE_APP_FTW',
      key: 'TGByhnUJM'
    })

    console.log('APP QUEUED!!!')
  }
})
