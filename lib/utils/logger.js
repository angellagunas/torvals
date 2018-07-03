const Logger = class Logger {

  constructor(info) {
    this.info = info || 'logger'
  }

  call(args) {
    console.log(`[${this.info}] ${args}`)
  }
}

module.exports = Logger
