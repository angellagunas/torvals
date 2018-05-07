// node tasks/migrations/set-week-datasetrows.js
require('../../config')
require('lib/databases/mongo')
const moment = require('moment')
const fs = require('fs')
const _ = require('lodash')

const Task = require('lib/task')
const { DataSetRow, AbraxasDate } = require('models')

const task = new Task(async function (argv) {
  console.log('Fetching DatasetsRows...')

  const filters = {'data.semanaBimbo': null}

  var today = new Date()
  var timestamp = today.getTime()

  const output = fs.createWriteStream(
    './tasks/logs/set-week-' + timestamp + '.txt'
  )
  const error = fs.createWriteStream(
    './tasks/logs/error-set-week-' + timestamp + '.txt'
  )
  console.log('Retrieving Datasetrows')
  const rows = await DataSetRow.find(filters).cursor()
  var bulkOps = []
  // var abraxasdate = await AbraxasDate.findOne({$or: [{ dateStart: row.data.forecastDate }, { dateEnd: row.data.forecastDate }]})
  var abraxasdates = await AbraxasDate.find()

  for (let row = await rows.next(); row != null; row = await rows.next()) {
    try {
      console.log('Searching for week...')
      var abraxasdate = _.find(abraxasdates, (date) => {
        return moment(date.dateStart).diff(moment(row.data.forecastDate), 'minutes') === 0 || moment(date.dateEnd).diff(moment(row.data.forecastDate), 'minutes') === 0
      })
      console.log('abraxasdate', abraxasdate)
      if (abraxasdate) {
        console.log('Date found!')
        console.log('DataSetRow ' + row.uuid)
        console.log('Date ' + row.data.forecastDate)
        console.log('Week ' + abraxasdate.week)

        output.write('Date found! ')
        output.write('DataSetRow ' + row.uuid)
        output.write(' Date ' + row.data.forecastDate)
        output.write(' Week ' + abraxasdate.week + ' \n')

        bulkOps.push(
          {
            'updateOne': {
              'filter': { '_id': row._id },
              'update': { '$set': { 'data.semanaBimbo': abraxasdate.week } }
            }
          }
        )
      } else {
        console.log('Date not found!!')
        console.log('DataSetRow ' + row.uuid)
        console.log('Date ' + row.data.forecastDate)

        output.write('Date not found!! ')
        output.write('DataSetRow ' + row.uuid)
        output.write(' Date ' + row.data.forecastDate + ' \n')
      }

      if (bulkOps.length === 1000) {
        console.log(`1000 ops ==> ${moment().format()}`)
        await DataSetRow.bulkWrite(bulkOps)
        bulkOps = []
        output.write(` \n 1000 ops ==> ${moment().format()} \n`)
      }
    } catch (e) {
      console.log('Error!!')
      console.log(e)
      error.write('Error!! \n')
      error.write(e)
      return false
    }
  }

  try {
    if (bulkOps.length > 0) await DataSetRow.bulkWrite(bulkOps)
    console.log(`Data saved ==> ${moment().format()}`)
    output.write(`Data saved ==> ${moment().format()}`)
  } catch (e) {
    console.log('Error!!')
    console.log(e)
    error.write('Error!! \n')
    error.write(e)
    return false
  }

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
