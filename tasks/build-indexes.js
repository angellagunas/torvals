// node tasks/create-admin --email admin@app.com --password foobar --name admin
require('../config')
require('lib/databases/mongo')
const path = require('path')
const fs = require('fs')
const nunjucks = require('nunjucks')

const config = require('config')
const Task = require('lib/task')

const task = new Task(async function (argv) {
  const adminIndexPath = path.resolve('./admin/views/index.html')
  const adminIndexDist = path.resolve('./admin/dist/index.html')

  const adminIndexFile = fs.readFileSync(adminIndexPath, 'utf-8')

  const adminIndexTemplate = nunjucks.compile(adminIndexFile)

  const adminCompileIndex = adminIndexTemplate.render({
    env: config.env,
    prefix: config.server.adminPrefix
  })

  fs.writeFileSync(adminIndexDist, adminCompileIndex)

  const appIndexPath = path.resolve('./app/views/index.html')
  const appIndexDist = path.resolve('./app/dist/index.html')

  const appIndexFile = fs.readFileSync(appIndexPath, 'utf-8')

  const appIndexTemplate = nunjucks.compile(appIndexFile)

  const appCompileIndex = appIndexTemplate.render({
    env: config.env
  })

  fs.writeFileSync(appIndexDist, appCompileIndex)
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
