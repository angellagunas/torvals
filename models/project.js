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

  status: {
    type: String,
    enum: [
      'empty',
      'processing',
      'ready',
      'reviewing',
      'pendingRows',
      'adjustment',
      'conciliating'
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

  dateCreated: { type: Date, default: moment.utc },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false }
}, { usePushEach: true })

projectSchema.plugin(dataTables)

projectSchema.methods.toPublic = function () {
  return {
    uuid: this.uuid,
    name: this.name,
    description: this.description,
    organization: this.organization,
    datasets: this.datasets,
    adjustment: this.adjustment,
    status: this.status,
    activeDataset: this.activeDataset,
    businessRules: this.businessRules,
    externalId: this.externalId,
    dateCreated: this.dateCreated
  }
}

projectSchema.methods.toAdmin = function () {
  return {
    uuid: this.uuid,
    name: this.name,
    description: this.description,
    organization: this.organization,
    datasets: this.datasets,
    adjustment: this.adjustment,
    status: this.status,
    activeDataset: this.activeDataset,
    businessRules: this.businessRules,
    externalId: this.externalId,
    dateCreated: this.dateCreated
  }
}

module.exports = mongoose.model('Project', projectSchema)
