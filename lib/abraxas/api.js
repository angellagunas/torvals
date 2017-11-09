const { abraxas } = require('../../config')
const request = require('request-promise-native')

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
    json: true
  }

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
