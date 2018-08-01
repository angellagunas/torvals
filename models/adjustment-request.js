const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')

// forecast on Abraxas API
const adjustmentRequestSchema = new Schema({
  organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  datasetRow: { type: Schema.Types.ObjectId, ref: 'DataSetRow', required: true },
  dataset: { type: Schema.Types.ObjectId, ref: 'DataSet', required: true },
  lastAdjustment: { type: Number },
  newAdjustment: { type: Number, required: true },
  requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  product: { type: Schema.Types.ObjectId, ref: 'Product' },
  newProduct: { type: Schema.Types.ObjectId, ref: 'CatalogItem' },
  catalogItems: [{ type: Schema.Types.ObjectId, ref: 'CatalogItem' }],
  status: {
    type: String,
    enum: ['created', 'approved', 'rejected'],
    default: 'created'
  },
  cycle: { type: Schema.Types.ObjectId, ref: 'Cycle', required: true },
  period: { type: Schema.Types.ObjectId, ref: 'Period', required: true},
  dateRequested: { type: Date, default: moment.utc },
  dateApproved: { type: Date },
  dateRejected: { type: Date },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false }
}, { usePushEach: true })

adjustmentRequestSchema.plugin(dataTables)

adjustmentRequestSchema.methods.toPublic = function () {
  return {
    uuid: this.uuid,
    dateRequested: this.dateRequested,
    dateRejected: this.dateRejected,
    dateApproved: this.dateApproved,
    requestedBy: this.requestedBy,
    rejectedBy: this.rejectedBy,
    approvedBy: this.approvedBy,
    organization: this.organization,
    datasetRow: this.datasetRow,
    dataset: this.dataset,
    project: this.project,
    status: this.status,
    newAdjustment: this.newAdjustment,
    catalogItems: this.catalogItems,
    lastAdjustment: this.lastAdjustment,
    newProduct: this.newProduct,
    period: this.period,
    cycle: this.cycle
  }
}

adjustmentRequestSchema.methods.toAdmin = function () {
  return {
    uuid: this.uuid,
    dateRequested: this.dateRequested,
    dateRejected: this.dateRejected,
    dateApproved: this.dateApproved,
    requestedBy: this.requestedBy,
    rejectedBy: this.rejectedBy,
    approvedBy: this.approvedBy,
    organization: this.organization,
    datasetRow: this.datasetRow,
    dataset: this.dataset,
    project: this.project,
    status: this.status,
    lastAdjustment: this.lastAdjustment,
    catalogItems: this.catalogItems,
    newAdjustment: this.newAdjustment,
    newProduct: this.newProduct,
    period: this.period,
    cycle: this.cycle
  }
}

adjustmentRequestSchema.index({ 'dataset': 1,
  'isDeleted': -1,
  'status': 1 }, {background: true})
adjustmentRequestSchema.set('autoIndex', true)

module.exports = mongoose.model('AdjustmentRequest', adjustmentRequestSchema)