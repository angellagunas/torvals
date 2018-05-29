const parseArgs = require('minimist')
const co = require('co')

const Task = class Task {
  constructor (fn, before, after, timeout = 10) {
    this._fn = fn
    this._timeout = timeout
    this.before = before
    this.after = after
  }

  run (argv) {
    const wrap = co.wrap(this._fn)
    argv = argv || parseArgs(process.argv.slice(2))

    if (this.before) this.before(argv)

    var q = wrap(argv).then(() => { if (this.after) this.after(argv) })

    if (this._cli) {
      q.then(data => {
        console.log('Success =>', data)

        setTimeout(() => process.exit(), this._timeout)
      }).catch(err => {
        console.error('=>', err)
        process.nextTick(() => process.exit(1))
      })
    }

    return q
  }

  setCliHandlers () {
    this._cli = true
  }
}

module.exports = Task
