const Router = require('lib/router/router')
const koaBody = require('koa-body')

module.exports = new Router({
  routes: require('es6-requireindex')(__dirname, { recursive: false }),
  prefix: '/upload',
  middlewares: [koaBody({ multipart: true })]
})
