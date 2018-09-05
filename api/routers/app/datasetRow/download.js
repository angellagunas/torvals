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
      }).populate('catalog')
      catalogItems.push(catalogItem)
    }
    filters['catalogItems'] = {
      '$all': catalogItems.map((item) => item._id)
    }

    const rows = await DataSetRow.find({
      dataset: project.activeDataset._id,
      isDeleted: false,
      ...filters
    }).populate('newProduct')

    let rowsCsv = ''
    let names = []
    let rowBeginning = ''
    for (let item of catalogItems) {
      names.push(`"${item.catalog.slug}_id"`, `"${item.catalog.slug}_name"`)
      rowBeginning += `"${item.externalId}","${item.name}",`
    }
    names.push('"producto_id"', '"producto_name"', '"fecha"', '"prediccion"', '"ajuste"')

    rowsCsv = `${names.join()}\r\n`

    rowsCsv = rowsCsv.substring(0, rowsCsv.length - 1) + '\r\n'
    for (let row of rows) {
      let rowsString = rowBeginning

      rowsString += `"${row.newProduct.externalId}","${row.newProduct.name}",`

      rowsString += `"${moment.utc(row.data.forecastDate, 'YYYY-MM-DD').format("YYYY-MM-DD")}",`

      rowsString += `"${row.data.prediction}","${row.data.adjustment}"\r\n`

      rowsCsv += rowsString
    }

    ctx.set('Content-disposition', `attachment; filename=datasetrow.csv`)
    ctx.set('Content-type', `text/csv`)

    ctx.body = rowsCsv
  }
})
