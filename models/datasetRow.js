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
    lastAdjustment: { type: Number },
    semanaBimbo: { type: Number },
    month: { type: String },
    year: { type: String },
    forecastDate: { type: String },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    channelId: { type: Number },
    channelName: { type: String }
  },
  apiData: { type: Schema.Types.Mixed },

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
    status: this.status
  }
}

datasetRowSchema.methods.format = function () {
  return {
    uuid: this.uuid,
    dateCreated: this.dateCreated,
    organization: this.organization,
    project: this.project,
    status: this.status,
    data: this.data
  }
}

module.exports = mongoose.model('DataSetRow', datasetRowSchema)
