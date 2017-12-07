const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')

// forecast on Abraxas API
const predictionSchema = new Schema({
  organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  forecast: { type: Schema.Types.ObjectId, ref: 'Forecast', required: true },
  salesCenter: { type: Schema.Types.ObjectId, ref: 'SalesCenter' },
  product: { type: Schema.Types.ObjectId, ref: 'Product' },
  externalId: { type: String },
  status: {
    type: String,
    enum: ['created', 'processing', 'done'],
    default: 'created'
  },
  data: { type: Schema.Types.Mixed },

  dateCreated: { type: Date, default: moment.utc },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false }
})

predictionSchema.plugin(dataTables)

predictionSchema.methods.toPublic = function () {
  return {
    uuid: this.uuid,
    dateCreated: this.dateCreated,
    organization: this.organization,
    project: this.project,
    status: this.status
  }
}

predictionSchema.methods.format = function () {
  return {
    uuid: this.uuid,
    dateCreated: this.dateCreated,
    organization: this.organization,
    project: this.project,
    status: this.status
  }
}

module.exports = mongoose.model('Prediction', predictionSchema)
