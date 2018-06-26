const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')

// forecast on Abraxas API
const anomalySchema = new Schema({
  dateCreated: { type: Date, default: moment.utc },
  date: { type: Date },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false },
  project: { type: Schema.Types.ObjectId, ref: 'Project' },
  product: { type: Schema.Types.ObjectId, ref: 'Product' },
  newProduct: {type: Schema.Types.ObjectId, ref: 'CatalogItem'},
  organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
  externalId: { type: String },
  prediction: { type: Number },
  type: { type: String },
  apiData: {type: Schema.Types.Mixed},
  data: {type: Schema.Types.Mixed},
  cycle: { type: Schema.Types.ObjectId, ref: 'Cycle' },
  period: { type: Schema.Types.ObjectId, ref: 'Period' },
  catalogItems: [{ type: Schema.Types.ObjectId, ref: 'CatalogItem' }]
}, { usePushEach: true })

anomalySchema.plugin(dataTables)

anomalySchema.methods.toPublic = function () {
  return {
    uuid: this.uuid,
    dateCreated: this.dateCreated,
    product: this.product,
    newProduct: this.newProduct,
    salesCenter: this.salesCenter,
    prediction: this.prediction,
    channel: this.channel,
    organization: this.organization,
    semanaBimbo: this.semanaBimbo,
    date: this.date,
    type: this.type,
    catalogItems: this.catalogItems
  }
}

anomalySchema.methods.toAdmin = function () {
  return {
    uuid: this.uuid,
    dateCreated: this.dateCreated,
    product: this.product,
    newProduct: this.newProduct,
    salesCenter: this.salesCenter,
    prediction: this.prediction,
    channel: this.channel,
    organization: this.organization,
    semanaBimbo: this.semanaBimbo,
    date: this.date,
    type: this.type,
    catalogItems: this.catalogItems
  }
}

anomalySchema.index({ externalId: 1, dataset: 1 }, { background: true })
anomalySchema.set('autoIndex', true)

module.exports = mongoose.model('Anomaly', anomalySchema)
