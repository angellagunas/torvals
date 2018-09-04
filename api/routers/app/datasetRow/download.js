const Route = require('lib/router/route')
const {
  CatalogItem,
  Cycle,
  DataSetRow,
  Project
} = require('models')
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
    const data = ctx.request.body
    const project = await Project.findOne({uuid: ctx.params.uuid})
      .populate('organization')
      .populate('activeDataset mainDataset')

    ctx.assert(project, 404, 'Proyecto no encontrado')

    if (!project.activeDataset) {
      ctx.throw(400, 'No hay DataSet activo para el proyecto')
    }

    let cycles = await Cycle.getBetweenDates(
      project.organization._id,
      project.rule,
      moment.utc(data.start_date, 'YYYY-MM-DD').toDate(),
      moment.utc(data.end_date, 'YYYY-MM-DD').toDate()
    )
    let filters = {
      'cycle': {
        $in: cycles.map(item => { return item._id })
      }
    }

    var otherFilters = {
      showAdjusted: data.showAdjusted,
      showNotAdjusted: data.showNotAdjusted,
      searchTerm: data.searchTerm
    }

    delete data.showAdjusted
    delete data.showNotAdjusted
    delete data.searchTerm

    catalogItems = []
    for (let filter of Object.keys(data)) {
      const unwantedKeys = [
        'start_date',
        'end_date',
        'salesCenter',
        'channel',
        'product'
      ]
      if (unwantedKeys.includes(filter)) {
        continue
      }
      const catalogItem = await CatalogItem.findOne({
        uuid: data[filter]
      })
      catalogItems.push(catalogItem._id)
    }
    filters['catalogItems'] = {
      '$all': catalogItems
    }

    if (otherFilters.showAdjusted && !otherFilters.showNotAdjusted) {
      filters['status'] = 'adjusted'
    } else if (!otherFilters.showAdjusted && otherFilters.showNotAdjusted) {
      filters['status'] = 'unmodified'
    }

    let rows = await DataSetRow.find({
      dataset: project.activeDataset._id,
      isDeleted: false,
      ...filters
    }).populate('newProduct catalogItems period')

    let rowsCsv = ''
    let names = []

    for (let head of project.mainDataset.columns) {
      if (head.name != 'modelo' && head.name != 'month' && head.name != 'venta' && head.name != 'venta_uni' && head.name != 'year' && head.name != 'semana_bimbo' && head.name != 'clasificacion') {
        if (head.name === 'agencia_id') {
          rowsCsv += head.name + ','
          names.push(head.name)

          rowsCsv += 'agencia_nombre,'
          names.push('agencia_nombre')
        } else {
          rowsCsv += head.name + ','
          names.push(head.name)
        }
      }
    }

    rowsCsv += 'periodo, periodo_inicio'
    names.push('periodo')
    names.push('periodo_inicio')

    rowsCsv = rowsCsv.substring(0, rowsCsv.length - 1) + '\r\n'
    for (let row of rows) {
      let rowsString = ''
      const regEx = new RegExp(otherFilters.searchTerm, 'gi')
      const searchStr = `${row.newProduct.name} ${row.newProduct.externalId}`

      if (!regEx.test(searchStr)) { continue }

      for (let col of names) {
        var predictionColumn = project.mainDataset.getPredictionColumn() || {name: ''}
        var adjustmentColumn = project.mainDataset.getAdjustmentColumn() || {name: ''}

        if (col === adjustmentColumn.name) {
          rowsString += row.data.adjustment + ','
          continue
        } else if (col === predictionColumn.name) {
          rowsString += row.data.prediction + ','
          continue
        } else if (col === 'producto_nombre') {
          rowsString += row.newProduct.name + ','
        } else if (col === 'agencia_id') {
          let agency = row.catalogItems.find(item => item.type === 'centro-de-venta')
          if (agency) {
            rowsString += agency.externalId + ','
          } else {
            rowsString += ','
          }
        } else if (col === 'canal_nombre') {
          let canal = row.catalogItems.find(item => item.type === 'canal')
          if (canal) {
            rowsString += canal.name + ','
          } else {
            rowsString += ','
          }
        } else if (col === 'agencia_nombre') {
          let agency = row.catalogItems.find(item => item.type === 'centro-de-venta')
          if (agency) {
            rowsString += agency.name + ','
          } else {
            rowsString += ','
          }
        } else if (col === 'periodo') {
          rowsString += row.period.period + ','
        } else if (col === 'periodo_inicio') {
          rowsString += moment.utc(row.period.dateStart, 'YYYY-MM-DD').format('DD-MM-YYYY') + ','
        } else if (row.apiData[col]) {
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
