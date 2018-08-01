// node tasks/labels/create-labels.js --organization --language
require('../../config')
require('lib/databases/mongo')

const fs = require('fs')
const Task = require('lib/task')
const { Label, Language, Organization } = require('models')

const task = new Task(async function (argv) {
  console.log('Fetching organization...')

  if (!argv.organization) {
    console.log('Error: Organization is required')
    return false
  }

  if (!argv.language) {
    console.log('Error: Language is required')
    return false
  }

  const labels = await Label.find({
    organization: argv.organization,
    language: argv.language
  }).lean().exec(function (err, labels) {
    return res.end(JSON.stringify(labels));
  })

  const organization = await Organization.findOne({
    _id: organization
  })

  const language = await Language.findOne({
    _id: language
  })

  const path = './app/frontend/translations'
  const translationFile = 'translations.json'
  const languageCode = `${language.code}-${organization.slug}`

  let labelsJson = JSON.parse(fs.readFileSync('fileName.json').toString());
  labelsJson[languageCode] = labels
  fs.writeFile(translationFile, JSON.stringify(labelsJson))

  console.log(`Labels created!`)
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
