const Router = require('lib/router/router')
const { loggedIn } = require('api/middlewares')

module.exports = new Router({
  routes: require('es6-requireindex')(__dirname, { recursive: false }),
  prefix: '/app',
  middlewares: [loggedIn]
})
