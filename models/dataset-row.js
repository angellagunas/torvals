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
  adjustmentRequest: { type: Schema.Types.ObjectId, ref: 'AdjustmentRequest' },
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
    localAdjustment: { type: Number },
    lastAdjustment: { type: Number },
    semanaBimbo: { type: Number },
    forecastDate: { type: Date }
  },
  apiData: { type: Schema.Types.Mixed },

  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  dateCreated: { type: Date, default: moment.utc },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false }
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
    data: this.data
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
    data: this.data
  }
}

datasetRowSchema.index({ isDeleted: -1, dataset: 1, status: 1, organization: 1 }, {background: true})
datasetRowSchema.set('autoIndex', true)

module.exports = mongoose.model('DataSetRow', datasetRowSchema)
