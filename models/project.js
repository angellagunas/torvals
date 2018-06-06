const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')

const projectSchema = new Schema({
  name: { type: String, required: true },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },

  // TODO: Remove
  datasets: [{
    dataset: { type: Schema.Types.ObjectId, ref: 'DataSet' },
    columns: [{
      name_dataset: { type: String },
      name_project: { type: String }
    }]
  }],
  mainDataset: { type: Schema.Types.ObjectId, ref: 'DataSet' },

  status: {
    type: String,
    enum: [
      'empty',
      'processing',
      'ready',
      'reviewing',
      'pendingRows',
      'adjustment',
      'conciliating',
      'cloning'
    ],
    default: 'empty'
  },
  cycleStatus: {
    type: String,
    enum: [
      'empty',
      'consolidation',
      'forecastCreation',
      'rangeAdjustmentRequest',
      'rangeAdjustment',
      'salesUpload'
    ],
    default: 'empty'
  },
  description: { type: String },
  externalId: { type: String },
  adjustment: { type: Number },
  activeDataset: { type: Schema.Types.ObjectId, ref: 'DataSet' },
  businessRules: {
    period: { type: Number },
    adjustments: { type: Schema.Types.Mixed },
    frequency: { type: Number }
  },
  showOnDashboard: { type: Boolean, default: true },
  etag: { type: String },
  dateMax: {type: Date},
  dateMin: {type: Date},
  dateCreated: { type: Date, default: moment.utc },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false },
  rule: {type: Schema.Types.ObjectId, ref: 'Rule'}
}, { usePushEach: true })

projectSchema.plugin(dataTables)

projectSchema.methods.toPublic = function () {
  return {
    uuid: this.uuid,
    name: this.name,
    description: this.description,
    organization: this.organization,
    datasets: this.datasets,
    mainDataset: this.mainDataset,
    adjustment: this.adjustment,
    status: this.status,
    activeDataset: this.activeDataset,
    businessRules: this.businessRules,
    externalId: this.externalId,
    dateCreated: this.dateCreated,
    dateMin: this.dateMin,
    dateMax: this.dateMax,
    cycleStatus: this.cycleStatus,
    showOnDashboard: (this.showOnDashboard === null) ? true : this.showOnDashboard
  }
}

projectSchema.methods.toAdmin = function () {
  return {
    uuid: this.uuid,
    name: this.name,
    description: this.description,
    organization: this.organization,
    datasets: this.datasets,
    mainDataset: this.mainDataset,
    adjustment: this.adjustment,
    status: this.status,
    activeDataset: this.activeDataset,
    businessRules: this.businessRules,
    externalId: this.externalId,
    dateCreated: this.dateCreated,
    dateMin: this.dateMin,
    dateMax: this.dateMax,
    cycleStatus: this.cycleStatus,
    showOnDashboard: (this.showOnDashboard === null) ? true : this.showOnDashboard
  }
}

module.exports = mongoose.model('Project', projectSchema)
