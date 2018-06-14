const { Rule } = require('models')

module.exports = function createRules(opts = {}) {
  const rule = {
    startDate: '2018-01-01T00:00:00',
    cycleDuration: 1,
    cycle: 'M',
    period: 'M',
    periodDuration: 1,
    season: 12,
    cyclesAvailable:6,
    catalogs: [
      {
        name: 'producto',
        slug: 'producto'
      }
    ],
    ranges: [0, 0, 0, 0, 0, 0],
    takeStart: true,
    consolidation: 26,
    forecastCreation: 1,
    rangeAdjustment: 1,
    rangeAdjustmentRequest: 1,
    salesUpload : 1
  }

  return Rule.create(Object.assign({}, rule, opts))
}
