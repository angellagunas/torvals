// node tasks/verify-datasets.js
require('../../config')
require('lib/databases/mongo')

const Api = require('lib/abraxas/api')
const Task = require('lib/task')
const { DataSet, Product, SalesCenter } = require('models')
const request = require('lib/request')

const task = new Task(async function (argv) {
  console.log('Fetching procesing Datasets...')

  const datasets = await DataSet.find({
    status: 'processing',
    isDeleted: false
  })

  if (datasets.length === 0) {
    console.log('No processing datasets to verify ...')

    return true
  }

  console.log('Obtaining Abraxas API token ...')
  await Api.fetch()
  const apiData = Api.get()

  if (!apiData.token) {
    throw new Error('There is no API endpoint configured!')
  }

  for (var dataset of datasets) {
    console.log(`Verifying if ${dataset.name} dataset has finished processing ...`)
    var options = {
      url: `${apiData.hostname}${apiData.baseUrl}/datasets/${dataset.externalId}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiData.token}`
      },
      json: true,
      persist: true
    }

    var res = await request(options)

    if (res.status === 'ready') {
      console.log(`${dataset.name} dataset has finished processing`)

      for (var a of res.data.agencia_id) {
        var salesCenter = await SalesCenter.findOne({
          externalId: a,
          organization: dataset.organization
        })

        if (!salesCenter) {
          salesCenter = await SalesCenter.create({
            name: 'Not identified',
            externalId: a,
            organization: dataset.organization
          })

          dataset.newSalesCenters.push(salesCenter)
        } else {
          var pos = dataset.salesCenters.findIndex(item => {
            return String(item._id) === String(salesCenter._id)
          })

          var posNew = dataset.newSalesCenters.findIndex(item => {
            return String(item._id) === String(salesCenter._id)
          })

          if (pos < 0 && posNew < 0) dataset.salesCenters.push(salesCenter)
        }
      }

      for (var p of res.data.producto_id) {
        var product = await Product.findOne({
          externalId: p,
          organization: dataset.organization
        })

        if (!product) {
          product = await Product.create({
            name: 'Not identified',
            externalId: p,
            organization: dataset.organization
          })

          dataset.newProducts.push(product)
        } else {
          pos = dataset.products.findIndex(item => {
            return String(item._id) === String(product._id)
          })

          posNew = dataset.newProducts.findIndex(item => {
            return String(item._id) === String(product._id)
          })

          if (pos < 0 && posNew < 0) dataset.products.push(product)
        }
      }

      if (res.data.agency_id && res.data.product_id) {
        for (a of res.data.agency_id) {
          salesCenter = await SalesCenter.findOne({
            externalId: a,
            organization: dataset.organization
          })

          if (!salesCenter) {
            salesCenter = await SalesCenter.create({
              name: 'Not identified',
              externalId: a,
              organization: dataset.organization
            })

            dataset.newSalesCenters.push(salesCenter)
          } else {
            pos = dataset.salesCenters.findIndex(item => {
              return String(item._id) === String(salesCenter._id)
            })

            posNew = dataset.newSalesCenters.findIndex(item => {
              return String(item._id) === String(salesCenter._id)
            })

            if (pos < 0 && posNew < 0) dataset.salesCenters.push(salesCenter)
          }
        }

        for (p of res.data.product_id) {
          product = await Product.findOne({
            externalId: p,
            organization: dataset.organization
          })

          if (!product) {
            product = await Product.create({
              name: 'Not identified',
              externalId: p,
              organization: dataset.organization
            })

            dataset.newProducts.push(product)
          } else {
            pos = dataset.products.findIndex(item => {
              return String(item._id) === String(product._id)
            })

            posNew = dataset.newProducts.findIndex(item => {
              return String(item._id) === String(product._id)
            })

            if (pos < 0 && posNew < 0) dataset.products.push(product)
          }
        }
      }

      dataset.set({
        status: 'reviewing',
        dateMax: res.date_max,
        dateMin: res.date_min
      })

      await dataset.save()
    }
  }

  console.log(`Successfully verified ${datasets.length} datasets with status {processing}`)
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
