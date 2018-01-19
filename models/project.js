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
      'ready'
    ],
    default: 'empty'
  },

  description: { type: String },
  adjustment: { type: Number },
  businessRules: Schema.Types.Mixed,

  dateCreated: { type: Date, default: moment.utc },
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
    dateCreated: this.dateCreated
  }
}

module.exports = mongoose.model('Project', projectSchema)
