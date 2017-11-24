const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')

const projectSchema = new Schema({
  name: { type: String, required: true },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  datasets: [{
    dataset: { type: Schema.Types.ObjectId, ref: 'DataSet' },
    name_dataset: { type: String },
    name_project: { type: String }
  }],
  description: { type: String },
  businessRules: Schema.Types.Mixed,

  dateCreated: { type: Date, default: moment.utc },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false }
})

projectSchema.plugin(dataTables)

projectSchema.methods.toPublic = function () {
  return {
    uuid: this.uuid,
    name: this.name,
    description: this.description,
    organization: this.organization,
    datasets: this.datasets,
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
    dateCreated: this.dateCreated
  }
}

module.exports = mongoose.model('Project', projectSchema)
