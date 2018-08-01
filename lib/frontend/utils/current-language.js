const CurrentLanguage = class CurrentLanguage {

  constructor() {
    this.default = 'es-MX'
  }

  navigator() {
    return navigatorLanguage = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage
  }

  current() {
    return localStorage.getItem('lang') || this.default
  }
}

module.exports = CurrentLanguage
