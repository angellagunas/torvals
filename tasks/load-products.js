// node tasks/load-products --file <file> --org <slug>
require('../config')
require('lib/databases/mongo')
const Task = require('lib/task')
const fs = require('fs')
const { Product, Organization } = require('models')
const lov = require('lov')

var today = new Date()
var timestamp = today.getTime()

const schema = lov.array().required().items(
  lov.object().keys({
    product_id: lov.string().required(),
    name: lov.string().required(),
    category: lov.string().required()
  })
)

const task = new Task(async function (argv) {
  const output = fs.createWriteStream(
    './tasks/logs/load-products-' + timestamp + '.txt'
  )
  const error = fs.createWriteStream(
    './tasks/logs/error-load-products-' + timestamp + '.txt'
  )

  if (!argv.file || !argv.org) {
    throw new Error('A JSON file with the data and an organization slug are required!')
  }

  console.log('Starting ....')

  console.log('Fetching Organization ....')

  const org = await Organization.findOne({slug: argv.org})

  if (!org) {
    throw new Error("The organization wasn't found!")
  }

  let data = []

  try {
    console.log('Loading data from file ....')
    const saveFile = fs.readFileSync(
      argv.file,
      'utf8'
    )
    data = JSON.parse(saveFile)
  } catch (e) {
    error.write('Error when fetching data from Disk ' + e + '\n')
    console.log('---------------------------------------------------------')
    console.log('Error when fetching data from Disk ' + e)
    console.log('=========================================================')

    return false
  }

  console.log('Validating data ....')
  let result = lov.validate(data, schema)

  if (result.error) {
    error.write('Data validation error: ' + result.error + '\n')
    console.log('---------------------------------------------------------')
    console.log('Data validation error: ' + result.error)
    console.log('=========================================================')

    return false
  }

  console.log('Validation PASSED!')

  try {
    console.log('Saving products ....')
    for (var prod of data) {
      const product = await Product.findOne({
        externalId: prod.product_id
      })

      if (!product) {
        await Product.create({
          name: prod.name,
          externalId: prod.product_id,
          description: prod.description,
          category: prod.category,
          subcategory: prod.subcategory,
          type: prod.line,
          organization: org
        })
      }
    }
  } catch (e) {
    console.log('ERROR!!!!')
    console.log(e)
    output.write('ERROR!!!! \n')
    output.write(e)

    return false
  }

  console.log('All done, bye!')
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
