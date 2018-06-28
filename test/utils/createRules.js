const { Rule, Catalog } = require('models')

module.exports = async function createRules(opts = {}) {
  const catalog = await Catalog.create({
    name: 'producto',
    slug: 'producto',
    organization: opts.organization
  })

  const data = {
    startDate: '2018-01-01T00:00:00',
    cycleDuration: 1,
    cycle: 'M',
    period: 'w',
    periodDuration: 1,
    season: 12,
    cyclesAvailable:6,
    catalogs: [catalog],
    ranges: [0, 0, 0, 0, 0, 0],
    takeStart: true,
    consolidation: 26,
    forecastCreation: 1,
    rangeAdjustment: 1,
    rangeAdjustmentRequest: 1,
    salesUpload : 1
  }
  const rule = await Rule.create(Object.assign({}, data, opts))

  return rule
}
