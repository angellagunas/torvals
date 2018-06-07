const Route = require('lib/router/route')
const { Project, SalesCenter, Channel, Product, DataSetRow, Cycle } = require('models')
const lov = require('lov')
const moment = require('moment')

module.exports = new Route({
  method: 'post',
  path: '/download/:uuid',
  validator: lov.object().keys({
    start_date: lov.string().required(),
    end_date: lov.string().required()
  }),
  handler: async function (ctx) {
    var data = ctx.request.body
    const project = await Project.findOne({uuid: ctx.params.uuid})
      .populate('activeDataset mainDataset')

    ctx.assert(project, 404, 'Proyecto no encontrado')

    if (!project.activeDataset) {
      ctx.throw(400, 'No hay DataSet activo para el proyecto')
    }

    let cycles = await Cycle.getBetweenDates(
      project.organization._id,
      moment.utc(data.start_date, 'YYYY-MM-DD').toDate(),
      moment.utc(data.end_date, 'YYYY-MM-DD').toDate()
    )
    let filters = {
      'cycle': {
        $in: cycles.map(item => { return item.dateStart })
      }
    }

    if (data.salesCenter) {
      const salesCenter = await SalesCenter.findOne({uuid: data.salesCenter})
      ctx.assert(salesCenter, 404, 'Centro de ventas no encontrado')

      filters['salesCenter'] = salesCenter._id
    }

    if (data.channel) {
      const channel = await Channel.findOne({uuid: data.channel})
      ctx.assert(channel, 404, 'Canal no encontrado')

      filters['channel'] = channel._id
    }

    if (data.product) {
      const product = await Product.findOne({uuid: data.product})
      ctx.assert(product, 404, 'Producto no encontrado')

      filters['product'] = product._id
    }

    let rows = await DataSetRow.find({
      ...filters,
      isDeleted: false
    }).populate('product channel salesCenter')

    let rowsCsv = ''
    let names = []

    for (let head of project.mainDataset.columns) {
      rowsCsv += head.name + ','
      names.push(head.name)
    }

    rowsCsv = rowsCsv.substring(0, rowsCsv.length - 1) + '\r\n'

    for (let row of rows) {
      let rowsString = ''

      for (let col of names) {
        var predictionColumn = project.mainDataset.getPredictionColumn() || {name: ''}
        var adjustmentColumn = project.mainDataset.getAdjustmentColumn() || {name: ''}

        if (col === adjustmentColumn.name) {
          rowsString += row.data.adjustment + ','
          continue
        }

        if (col === predictionColumn.name) {
          rowsString += row.data.prediction + ','
          continue
        }

        if (row.apiData[col]) {
          rowsString += row.apiData[col] + ','
        } else {
          rowsString += ','
        }
      }

      rowsString = rowsString.substring(0, rowsString.length - 1) + '\r\n'

      rowsCsv += rowsString
    }

    ctx.set('Content-disposition', `attachment; filename=datasetrow.csv`)
    ctx.set('Content-type', `text/csv`)

    ctx.body = rowsCsv
  }
})
