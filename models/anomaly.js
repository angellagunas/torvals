const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')

// forecast on Abraxas API
const anomalySchema = new Schema({
  channel: { type: Schema.Types.ObjectId, ref: 'Channel' },
  dateCreated: { type: Date, default: moment.utc },
  date: { type: Date},
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false },
  dataset: { type: Schema.Types.ObjectId, ref: 'DataSet', required: true },
  product: { type: Schema.Types.ObjectId, ref: 'Product' },
  salesCenter: { type: Schema.Types.ObjectId, ref: 'SalesCenter' },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
  externalId: { type: String },
  prediction: { type: Number },
  semanaBimbo: { type: Number },
  type: { type: String },
  apiData: {type: Schema.Types.Mixed}
}, { usePushEach: true })

anomalySchema.plugin(dataTables)

anomalySchema.methods.toPublic = function () {
  return {
    uuid: this.uuid,
    dateCreated: this.dateCreated,
    product: this.product,
    salesCenter: this.salesCenter,
    status: this.status,
    prediction: this.prediction,
    channel: this.channel,
    organization: this.organization,
    semanaBimbo: this.semanaBimbo,
    type: this.type
  }
}

anomalySchema.methods.toAdmin = function () {
  return {
    uuid: this.uuid,
    dateCreated: this.dateCreated,
    product: this.product,
    salesCenter: this.salesCenter,
    status: this.status,
    prediction: this.prediction,
    channel: this.channel,
    organization: this.organization,
    semanaBimbo: this.semanaBimbo,
    type: this.type
  }
}

anomalySchema.index({ externalId: 1, dataset: 1}, {background: true})
anomalySchema.set('autoIndex', true)

module.exports = mongoose.model('Anomaly', anomalySchema)
