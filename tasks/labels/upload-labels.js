// node tasks/labels/create-labels.js --organization --language
// This script populate the labels database from the main language files.

require('../../config')
require('lib/databases/mongo')

const fs = require('fs')
const Logger = require('lib/utils/logger')
const path = require('path')
const Task = require('lib/task')
const { Label, Language, Organization } = require('models')

const task = new Task(async function (argv) {
  const log = new Logger('upload-labels')

  if (!argv.organization) {
    log.call('Error: Organization is required')
    return false
  }

  let filter = {}
  if (argv.language) {
    filter = {
      uuid: argv.language
    }
  }

  log.call('Fetching organization...')
  const organization = await Organization.findOne({
    uuid: argv.organization
  })
  const languages = await Language.find(filter)

  log.call('Inserting default label languages')
  // TODO: Change this to a better approach.
  for (language of languages) {
    const translationFile = `${language.code}.json`
    const translationsPath = path.resolve('.', 'app', 'frontend', 'translations', translationFile)

    const labelsJson = JSON.parse(fs.readFileSync(translationsPath).toString())
    const sections = Object.keys(labelsJson[language.code])
    for (section of sections) {
      const keys = Object.keys(labelsJson[language.code][section])
      for (key of keys) {
        await Label.create({
          organization: organization._id,
          language: language._id,
          path: language.code,
          key: `${section}.${key}`,
          text: labelsJson[language.code][section][key]
        })
      }
    }
  }

  log.call(`Labels inserted!`)
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
