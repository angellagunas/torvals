// node tasks/load-sales-centers --file <file> --org <slug>
require('../config')
require('lib/databases/mongo')
const Task = require('lib/task')
const fs = require('fs')
const { Prediction, SalesCenter, Product, Forecast } = require('models')
const lov = require('lov')

var today = new Date()
var timestamp = today.getTime()

const schema = lov.array().required().items(
  lov.object().keys({
    semana_bimbo: lov.number().required(),
    month: lov.number().required(),
    year: lov.number().required(),
    adjustment: lov.number().required(),
    existence: lov.number().required(),
    prediction: lov.number().required(),
    forecast_date: lov.string().required(),
    agency_id: lov.string().required(),
    product_id: lov.string().required(),
    name: lov.string().required()
  })
)

const task = new Task(async function (argv) {
  const output = fs.createWriteStream(
    './tasks/logs/load-predictions-' + timestamp + '.txt'
  )
  const error = fs.createWriteStream(
    './tasks/logs/error-load-predictions-' + timestamp + '.txt'
  )

  if (!argv.file || !argv.forecast) {
    throw new Error('A JSON file with the predictions and an uuid of a forecast are required!')
  }

  console.log('Starting ....')

  console.log('Fetching Organization ....')

  const forecast = await Forecast.findOne({uuid: argv.forecast})

  if (!forecast) {
    throw new Error("The forecast wasn't found!")
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
    console.log('Saving predictions ....')
    for (var d of data) {
      var salesCenter = await SalesCenter.findOne({externalId: d.agency_id})
      var product = await Product.findOne({externalId: d.product_id})

      if (!product) {
        product = await Product.create({
          name: 'Not identified',
          externalId: d.product_id,
          organization: forecast.organization
        })

        forecast.newProducts.push(product)
      } else {
        var pos = forecast.products.findIndex(item => {
          return String(item._id) === String(product._id)
        })

        var posNew = forecast.newProducts.findIndex(item => {
          return String(item._id) === String(product._id)
        })

        if (pos < 0 && posNew < 0) forecast.products.push(product)
      }

      if (!salesCenter) {
        salesCenter = await SalesCenter.create({
          name: 'Not identified',
          externalId: d.agency_id,
          organization: forecast.organization
        })

        forecast.newSalesCenters.push(salesCenter)
      } else {
        pos = forecast.salesCenters.findIndex(item => {
          return String(item._id) === String(salesCenter._id)
        })

        posNew = forecast.newSalesCenters.findIndex(item => {
          return String(item._id) === String(salesCenter._id)
        })

        if (pos < 0 && posNew < 0) forecast.salesCenters.push(salesCenter)
      }

      await Prediction.create({
        organization: forecast.organization,
        project: forecast.project,
        forecast: forecast,
        externalId: forecast.forecastId,
        data: {
          ...d,
          semanaBimbo: d.semana_bimbo,
          forecastDate: d.forecast_date,
          adjustment: d.prediction
        },
        apiData: d,
        salesCenter: salesCenter,
        product: product
      })
    }

    forecast.status = 'analistReview'
    await forecast.save()
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
