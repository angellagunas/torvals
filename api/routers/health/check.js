const Route = require('lib/router/route')

module.exports = new Route({
  method: 'get',
  path: '/check',
  handler: async function (ctx) {
    ctx.body = 'OK'
  }
})
