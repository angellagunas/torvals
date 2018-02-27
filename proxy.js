const proxy = require('redbird')({
  port: 8000,
  resolvers: [
    function (host, url) {
      if (/^\/api/.test(url)) {
        return 'http://127.0.0.1:3000/'
      }
    },
    function (host, url) {
      if (/orax\.io/.test(host)) {
        return 'http://127.0.0.1:4000'
      }
    }
  ]
})

proxy.register('orax.io/admin', 'http://127.0.0.1:5000/admin')
