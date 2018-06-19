const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')

const adjustmentDownloadSchema = new Schema({
  organization: {type: Schema.Types.ObjectId, ref: 'Organization', required: true},
  dateCreated: { type: Date, default: moment.utc },
  path: {type: String},
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false },
  project: {type: Schema.Types.ObjectId, ref: 'Project'},
  dataset: {type: Schema.Types.ObjectId, ref: 'DataSet'}

}, { usePushEach: true })

adjustmentDownloadSchema.methods.toPublic = function () {
  return {
    organization: this.organization,
    dateCreated: this.dateCreated,
    uuid: this.uuid,
    isDeleted: this.isDeleted,
    path: this.path,
    project: this.project
  }
}

adjustmentDownloadSchema.methods.toAdmin = function () {
  return {
    organization: this.organization,
    dateCreated: this.dateCreated,
    uuid: this.uuid,
    isDeleted: this.isDeleted,
    project: this.project
  }
}

adjustmentDownloadSchema.plugin(dataTables)

module.exports = mongoose.model('AdjustmentDownload', adjustmentDownloadSchema)
