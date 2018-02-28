const config = require('config')
const request = require('lib/request')
const abraxas = config.abraxas

var data = {
  hostname: abraxas.abraxasHostname,
  baseUrl: abraxas.abraxasBaseUrl
}
var interval

const fetchToken = async function () {
  var options = {
    url: abraxas.abraxasHostname + '' + abraxas.abraxasBaseUrl + '/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: {
      email: abraxas.abraxasUser,
      password: abraxas.abraxasSecret
    },
    json: true,
    persist: true
  }

  console.log('API Login =>', options, abraxas)
  var res = await request(options)

  data.token = res.token
}

fetchToken()

if (!interval) {
  interval = setInterval(() => {
    fetchToken()
  }, 12 * 60 * 60 * 1000)
}

module.exports = {
  get: function () {
    return data
  },
  fetch: async function () {
    await fetchToken()
  }
}
