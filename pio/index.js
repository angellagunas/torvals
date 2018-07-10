const config = require('config')

const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const logger = require('koa-logger')
const convert = require('koa-convert')
const cors = require('koa-cors')

const routers = require('./routers')
const { sanitizeBody } = require('lib/middlewares')

const { env } = config

const app = new Koa()

if (env !== 'test') {
  app.use(logger())
}

app.use(convert(cors()))
app.use(convert(bodyParser({
  strict: false,
  formLimit: '1mb',
  jsonLimit: '1mb'
})))

app.use(sanitizeBody)

// api routers
routers(app)

module.exports = app
