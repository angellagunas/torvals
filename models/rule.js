const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')

const rulesSchema = new Schema({
  dateCreated: { type: Date, default: moment.utc },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false },
  startDate: { type: Date },
  cycleDuration: {type: Number},
  cycle: {type: String},
  periodDuration: {type: Number},
  period: {type: String},
  season: {type: Number},
  cyclesAvailable: {type: Number},
  takeStart: {type: Boolean, default: false},
  consolidation: {type: Number},
  forecastCreation: {type: Number},
  rangeAdjustmentRequest: {type: Number},
  rangeAdjustment: {type: Number},
  salesUpload: {type: Number},
  ranges: [{type: Number}],
  catalogs: [{type: Schema.Types.ObjectId, ref: 'Catalog'}],
  organization: {type: Schema.Types.ObjectId, ref: 'Organization'},
  cycles: [{type: Schema.Types.ObjectId, ref: 'Cycle'}],
  periods: [{type: Schema.Types.ObjectId, ref: 'Period'}],
  isCurrent: {type: Boolean, default: true},
  version: {type: Number}
}, { usePushEach: true })

rulesSchema.plugin(dataTables)

rulesSchema.methods.toPublic = function () {
  var data = {
    uuid: this.uuid,
    dateCreated: this.dateCreated,
    isDeleted: this.isDeleted,
    startDate: this.startDate,
    cycleDuration: this.cycleDuration,
    cycle: this.cycle,
    periodDuration: this.periodDuration,
    period: this.period,
    season: this.season,
    cyclesAvailable: this.cyclesAvailable,
    takeStart: this.takeStart,
    consolidation: this.consolidation,
    forecastCreation: this.forecastCreation,
    rangeAdjustmentRequest: this.rangeAdjustmentRequest,
    rangeAdjustment: this.rangeAdjustment,
    salesUpload: this.salesUpload,
    ranges: this.ranges,
    catalogs: this.catalogs,
    cycles: this.cycles,
    periods: this.periods,
    isCurrent: this.isCurrent
  }
  // if (this.organization) { data.organization = this.organization.toPublic() }
  return data
}

rulesSchema.methods.toAdmin = function () {
  var data = {
    uuid: this.uuid,
    dateCreated: this.dateCreated,
    isDeleted: this.isDeleted,
    startDate: this.startDate,
    cycleDuration: this.cycleDuration,
    cycle: this.cycle,
    periodDuration: this.periodDuration,
    period: this.period,
    season: this.season,
    cyclesAvailable: this.cyclesAvailable,
    takeStart: this.takeStart,
    consolidation: this.consolidation,
    forecastCreation: this.forecastCreation,
    rangeAdjustmentRequest: this.rangeAdjustmentRequest,
    rangeAdjustment: this.rangeAdjustment,
    salesUpload: this.salesUpload,
    ranges: this.ranges,
    catalogs: this.catalogs,
    cycles: this.cycles,
    periods: this.periods,
    isCurrent: this.isCurrent
  }
  // if (this.organization) { data.organization = this.organization.toPublic() }
  return data
}

module.exports = mongoose.model('Rule', rulesSchema)
