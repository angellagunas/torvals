const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')

// config_pr on Abraxas API
const forecastSchema = new Schema({
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  catalogs: [{ type: Schema.Types.ObjectId, ref: 'Catalog' }],
  dataset: { type: Schema.Types.ObjectId, ref: 'DataSet' },
  engine: { type: Schema.Types.ObjectId, ref: 'Engine', required: true },
  forecastGroup: { type: Schema.Types.ObjectId, ref: 'ForecastGroup', required: true },

  dateEnd: { type: Date },
  dateStart: { type: Date },
  instanceKey: { type: String, required: true, unique: true },
  port: { type: Number },
  status: {
    type: String,
    enum: [
      'created',
      'initializing',
      'sendingInfo',
      'building',
      'training',
      'deploying',
      'batchPredict',
      'conciliatingPrediction',
      'ready'
    ],
    default: 'created'
  },

  dateCreated: { type: Date, default: moment.utc },
  isDeleted: { type: Boolean, default: false },
  uuid: { type: String, default: v4, unique: true }

}, { usePushEach: true })

forecastSchema.plugin(dataTables)

forecastSchema.methods.toPublic = function () {
  return {
    approvedBy: this.approvedBy,
    catalogs: this.catalogs,
    dataset: this.dataset,
    engine: this.engine,
    forecastGroup: this.forecastGroup,
    dateEnd: this.dateEnd,
    dateStart: this.dateStart,
    instanceKey: this.instanceKey,
    port: this.port,
    status: this.status,
    uuid: this.uuid
  }
}

forecastSchema.methods.toAdmin = function () {
  return {
    approvedBy: this.approvedBy,
    catalogs: this.catalogs,
    dataset: this.dataset,
    engine: this.engine,
    forecastGroup: this.forecastGroup,
    dateEnd: this.dateEnd,
    dateStart: this.dateStart,
    instanceKey: this.instanceKey,
    port: this.port,
    status: this.status,
    uuid: this.uuid
  }
}

module.exports = mongoose.model('Forecast', forecastSchema)
