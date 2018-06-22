const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')

const priceSchema = new Schema({
  price: { type: Number },
  externalId: { type: String },
  product: { type: Schema.Types.ObjectId, ref: 'CatalogItem' },
  catalogItems: [{type: Schema.Types.ObjectId, ref: 'CatalogItem'}],
  organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
  etag: { type: String },
  dateCreated: { type: Date, default: moment.utc },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false }
})

priceSchema.plugin(dataTables)

priceSchema.methods.toAdmin = function () {
  let data = {
    uuid: this.uuid,
    externalId: this.externalId,
    price: this.price,
    product: this.product,
    channel: this.catalogItems,
    etag: this.etag,
    dateCreated: this.dateCreated,
    organization: this.organization
  }
  if (this.channel && this.channel.toPublic) { data.channel = this.channel.toPublic() }
  return data
}

priceSchema.methods.toPublic = function () {
  let data = {
    uuid: this.uuid,
    externalId: this.externalId,
    price: this.price,
    product: this.product,
    channel: this.catalogItems,
    etag: this.etag,
    dateCreated: this.dateCreated,
    organization: this.organization
  }
  if (this.channel && this.channel.toPublic) { data.channel = this.channel.toPublic() }
  return data
}

module.exports = mongoose.model('Price', priceSchema)
