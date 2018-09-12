// node tasks/migrations/migrate-user-languages.js
require('../../config')
require('lib/databases/mongo')
const moment = require('moment')
const slugify = require('underscore.string/slugify')

const Logger = require('lib/utils/logger')
const Task = require('lib/task')
const { Language, User } = require('models')

const task = new Task(async function (argv) {
  const log = new Logger('migrate-users-languages')
  log.call(`Start ==>  ${moment().format()}`)

  log.call('Fetching languages...')
  const languages = await Language.find()
  const defaultLanguage = languages.find((language) => language.code === 'es-MX')
  if (!languages || !defaultLanguage) {
    log.call('There is no default language...')
    return false
  }

  const users = await User.find()
  for (let user of users) {
    if (user.language) {
      const userLanguage = languages.find((language) => language._id.toString() === user.language.toString())
      if (userLanguage) {
        continue
      }
    }
    user.set({
      language: defaultLanguage._id
    })
    await user.save()
  }

  log.call(`End ==>  ${moment().format()}`)
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
