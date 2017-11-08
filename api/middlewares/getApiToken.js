const url = require('url')

const { Api } = require('models')
const { server } = require('config')
const moment = require('moment')
const request = require('request-promise-native')

module.exports = async function (ctx, next) {
  var api = await Api.findOne({})

  if (!api) {
    api = await Api.create({
      name: 'Abraxas',
      baseUrl: '/api/v1',
      hostname: 'pythia.abraxasintelligence.com',
      username: 'admin@abraxasintelligence.com',
      password: 'somePasswordHere'
    })
  }

  console.log(api)

  var options = {
    url: api.hostname + '' + api.baseUrl + '/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    form: {
      email: api.username,
      password: api.password
    }
  }

  var res = await request(options)
  console.log(res)

  await next()
}
