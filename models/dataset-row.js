const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')

// forecast on Abraxas API
const datasetRowSchema = new Schema({
  organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  dataset: { type: Schema.Types.ObjectId, ref: 'DataSet', required: true },
  salesCenter: { type: Schema.Types.ObjectId, ref: 'SalesCenter' },
  product: { type: Schema.Types.ObjectId, ref: 'Product' },
  channel: { type: Schema.Types.ObjectId, ref: 'Channel' },
  catalogItems: [{ type: Schema.Types.ObjectId, ref: 'CatalogItem' }],
  adjustmentRequest: { type: Schema.Types.ObjectId, ref: 'AdjustmentRequest' },
  cycle: { type: Schema.Types.ObjectId, ref: 'Cycle' },
  period: { type: Schema.Types.ObjectId, ref: 'Period' },
  externalId: { type: String },
  status: {
    type: String,
    enum: [
      'created',
      'processing',
      'done',
      'unmodified',
      'sendingChanges',
      'adjusted',
      'error'
    ],
    default: 'unmodified'
  },
  data: {
    existence: { type: Number },
    prediction: { type: Number },
    adjustment: { type: Number },
    sale: { type: Number },
    lastAdjustment: { type: Number },
    semanaBimbo: { type: Number },
    forecastDate: { type: Date },
    productExternalId: { type: String },
    channelExternalId: { type: String },
    salesCenterExternalId: { type: String }
  },
  catalogData: { type: Schema.Types.Mixed },
  apiData: { type: Schema.Types.Mixed },

  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  dateCreated: { type: Date, default: moment.utc },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false },
  isAnomaly: { type: Boolean, default: false }
}, { usePushEach: true })

datasetRowSchema.plugin(dataTables)

datasetRowSchema.methods.toPublic = function () {
  return {
    uuid: this.uuid,
    dateCreated: this.dateCreated,
    organization: this.organization,
    project: this.project,
    product: this.product,
    salesCenter: this.salesCenter,
    status: this.status,
    data: this.data,
    cycle: this.cycle,
    period: this.period
  }
}

datasetRowSchema.methods.toAdmin = function () {
  return {
    uuid: this.uuid,
    dateCreated: this.dateCreated,
    organization: this.organization,
    project: this.project,
    product: this.product,
    salesCenter: this.salesCenter,
    status: this.status,
    data: this.data,
    cycle: this.cycle,
    period: this.period
  }
}

datasetRowSchema.index({ isDeleted: -1, dataset: 1, status: 1, organization: 1 }, {background: true})
datasetRowSchema.index({ isDeleted: -1, uuid: 1 }, {background: true})
datasetRowSchema.index({ product: 1 }, {background: true})
datasetRowSchema.index({ dataset: 1 }, {background: true})
datasetRowSchema.index({ dataset: 1, 'data.productExternalId': 1 }, {background: true})
datasetRowSchema.index({ dataset: 1, 'data.channelExternalId': 1 }, {background: true})
datasetRowSchema.index({ dataset: 1, 'data.salesCenterExternalId': 1 }, {background: true})
datasetRowSchema.index({ 'data.forecastDate': 1 }, {background: true})
datasetRowSchema.index(
  {
    'apiData.producto_id': 1,
    'apiData.agencia_id': 1,
    'apiData.canal_id': 1,
    'apiData.fecha': 1,
    'dataset': 1
  },
  {background: true}
)

datasetRowSchema.index(
  {
    'dataset': 1,
    'catalogItems': 1,
    'cycle': 1
  },
  {background: true}
)
datasetRowSchema.index(
  {
    'dataset': 1,
    'catalogItems': 1,
    'period': 1
  },
  {background: true}
)

datasetRowSchema.set('autoIndex', true)

module.exports = mongoose.model('DataSetRow', datasetRowSchema)
