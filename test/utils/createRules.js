const moment = require('moment')

const { Rule, Catalog } = require('models')

module.exports = async function createRules(opts = {}) {
  const product_catalog = await Catalog.create({
    name: 'producto',
    slug: 'producto',
    organization: opts.organization
  })

  const sale_center_catalog = await Catalog.create({
    name: 'centro de venta',
    slug: 'centro-de-venta',
    organization: opts.organization
  })

  const channel_catalog = await Catalog.create({
    name: 'Canal',
    slug: 'canal',
    organization: opts.organization
  })

  const data = {
    startDate: moment.utc('2018-01-01'),
    cycleDuration: 1,
    cycle: 'M',
    period: 'w',
    periodDuration: 1,
    season: 12,
    cyclesAvailable:6,
    catalogs: [product_catalog, sale_center_catalog, channel_catalog],
    ranges: [0, 0, 0, 0, 0, 0],
    takeStart: true,
    consolidation: 26,
    forecastCreation: 1,
    rangeAdjustment: 1,
    rangeAdjustmentRequest: 1,
    salesUpload : 1,
    isCurrent: true
  }
  const rule = await Rule.create(Object.assign({}, data, opts))

  return rule
}
