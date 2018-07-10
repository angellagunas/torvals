const moment = require('moment')
const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')

const forecastGroupSchema = new Schema({
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  forecasts: [{ type: Schema.Types.ObjectId, ref: 'Forecast' }],
  catalogs: [{type: Schema.Types.ObjectId, ref: 'Catalog'}],
  cycles: [{type: Schema.Types.ObjectId, ref: 'Cycle'}],
  engines: [{type: Schema.Types.ObjectId, ref: 'Engine'}],
  alias: { type: String },
  type: {
    type: String,
    enum: [
      'created',
      'informative',
      'compatible'
    ],
    default: 'informative'
  },

  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  dateCreated: { type: Date, default: moment.utc },
  isDeleted: { type: Boolean, default: false },
  uuid: { type: String, default: v4, unique: true }

}, { usePushEach: true })

forecastGroupSchema.methods.toAdmin = function () {
  return {
    project: this.project,
    forecasts: this.forecasts,
    alias: this.alias,
    type: this.type,
    uuid: this.uuid
  }
}

forecastGroupSchema.methods.toPublic = function () {
  return {
    project: this.project,
    forecasts: this.forecasts,
    alias: this.alias,
    type: this.type,
    uuid: this.uuid
  }
}

forecastGroupSchema.plugin(dataTables)

module.exports = mongoose.model('ForecastGroup', forecastGroupSchema)
