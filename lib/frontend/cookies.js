import env from '~base/env-variables'

export default {
  set: function (name, value, days) {
    const baseUrl = env.APP_HOST.split('://')
    const baseDomain = baseUrl[1].split(':')

    var expires = ''
    if (days) {
      var date = new Date()
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000))
      expires = '; expires=' + date.toUTCString()
    }

    document.cookie = name + '=' + value + expires + '; domain=.' + baseDomain[0]
  },
  get: function (name) {
    var nameEQ = name + '='
    var ca = document.cookie.split(';')
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i]
      while (c.charAt(0) === ' ') c = c.substring(1, c.length)
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
    }
    return null
  },
  remove: function (name) {
    this.set(name, '', -1)
  }
}
