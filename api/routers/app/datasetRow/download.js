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
    const project = await Project.findOne({
      isDeleted: false,
      uuid: ctx.params.uuid
    })
      .populate('activeDataset')

    ctx.assert(project, 404, 'Proyecto no encontrado')

    if (!project.activeDataset) {
      ctx.throw(400, 'No hay DataSet activo para el proyecto')
    }

    let cycles = await Cycle.getBetweenDates(
      project.organization,
      project.rule,
      moment.utc(data.start_date, 'YYYY-MM-DD').toDate(),
      moment.utc(data.end_date, 'YYYY-MM-DD').toDate()
    )
    let filters = {
      'cycle': {
        $in: cycles.map(item => { return item._id })
      }
    }

    let catalogItems = []
    for (let filter of Object.keys(data)) {
      const unwantedKeys = [
        'start_date',
        'end_date',
        'salesCenter',
        'channel',
        'product',
        'showAdjusted',
        'showNotAdjusted',
        'searchTerm',
        'noHeaders'
      ]
      if (unwantedKeys.includes(filter)) {
        continue
      }
      const catalogItem = await CatalogItem.findOne({
        isDeleted: false,
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
      .populate('period')

    let rowsCsv = ''
    let names = []
    let rowBeginning = ''
    for (let item of catalogItems) {
      names.push(`"${item.catalog.slug}_id"`, `"${item.catalog.slug}_name"`)
      rowBeginning += `"${item.externalId}","${item.name}",`
    }
    names.push('"producto_id"', '"producto_name"', '"fecha"', '"periodo"', '"prediccion"', '"ajuste"')

    rowsCsv = !data.noHeaders ? `${names.join()}\r\n` : ''

    for (let row of rows) {
      let rowsString = rowBeginning

      rowsString += `"${ row.newProduct.externalId}","${row.newProduct.name }",`

      rowsString += `"${ moment.utc(row.data.forecastDate, 'YYYY-MM-DD').format("YYYY-MM-DD") }",`

      rowsString += `"${ row.period.period }",`

      rowsString += `"${ row.data.prediction}","${row.data.adjustment }"\r\n`

      rowsCsv += rowsString
    }

    ctx.set('Content-disposition', `attachment; filename=datasetrow.csv`)
    ctx.set('Content-type', `text/csv`)

    ctx.body = rowsCsv
  }
})
