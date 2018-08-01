// node tasks/labels/create-labels.js --organization --language
require('../../config')
require('lib/databases/mongo')

const fs = require('fs')
const Logger = require('lib/utils/logger')
const path = require('path')
const Task = require('lib/task')
const { Label, Language, Organization } = require('models')

const task = new Task(async function (argv) {
  const log = new Logger('create-labels')

  if (!argv.organization) {
    log.call('Error: Organization is required')
    return false
  }

  if (!argv.language) {
    log.call('Error: Language is required')
    return false
  }

  log.call('Fetching organization...')
  const organization = await Organization.findOne({
    uuid: argv.organization
  })

  const language = await Language.findOne({
    uuid: argv.language
  })

  log.call('Getting labels.')
  const labels = await Label.find({
    organization: organization._id,
    language: language._id
  }).lean().exec(function (err, labels) {
    return labels
  })

  let json = {}
  for (label of labels) {
    const keys = label.key.split('.')
    if (!json[keys[0]]) {
      json[keys[0]] = {}
    }
    if (!json[keys[0]][keys[1]]) {
      json[keys[0]][keys[1]] = label.text
    }
  }

  log.call('Saving json.')
  const languageCode = `${language.code}-${organization.slug}`
  const translationsPath = path.resolve('.', 'app', 'frontend', 'translations', `${languageCode}.json`)
  let result = {}
  result[languageCode] = json
  fs.writeFileSync(translationsPath, JSON.stringify(result))

  log.call(`Json ${languageCode}.json created!`)
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
