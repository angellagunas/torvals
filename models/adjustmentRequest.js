const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')

// forecast on Abraxas API
const adjustmentRequestSchema = new Schema({
  organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  forecast: { type: Schema.Types.ObjectId, ref: 'Forecast', required: true },
  prediction: { type: Schema.Types.ObjectId, ref: 'Prediction', required: true },
  lastAdjustment: { type: Number },
  newAdjustment: { type: Number, required: true },
  requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['created', 'approved', 'rejected'],
    default: 'created'
  },

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
    prediction: this.prediction,
    forecast: this.forecast,
    project: this.project,
    status: this.status,
    newAdjustment: this.newAdjustment,
    lastAdjustment: this.lastAdjustment
  }
}

adjustmentRequestSchema.methods.format = function () {
  return {
    uuid: this.uuid,
    dateRequested: this.dateRequested,
    dateRejected: this.dateRejected,
    dateApproved: this.dateApproved,
    requestedBy: this.requestedBy,
    rejectedBy: this.rejectedBy,
    approvedBy: this.approvedBy,
    organization: this.organization,
    prediction: this.prediction,
    forecast: this.forecast,
    project: this.project,
    status: this.status,
    lastAdjustment: this.lastAdjustment,
    newAdjustment: this.newAdjustment
  }
}

module.exports = mongoose.model('AdjustmentRequest', adjustmentRequestSchema)
