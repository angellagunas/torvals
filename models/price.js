const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')

const priceSchema = new Schema({
  price: { type: Number },
  externalId: { type: String },
  product: { type: Schema.Types.ObjectId, ref: 'Product' },
  productExternalId: { type: String },
  channel: { type: Schema.Types.ObjectId, ref: 'Channel' },
  channelExternalId: { type: String },
  etag: { type: String },
  dateCreated: { type: Date, default: moment.utc },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false }
})

priceSchema.plugin(dataTables)

priceSchema.methods.toAdmin = function () {
  data = {
    uuid: this.uuid,
    externalId: this.externalId,
    price: this.price,
    product: this.product,
    productExternalId: this.productExternalId,
    channel: this.channel,
    channelExternalId: this.channelExternalId,
    etag: this.etag,
    dateCreated: this.dateCreated
  }
  if (this.channel && this.channel.toPublic) { data.channel = this.channel.toPublic() }
  return data
}

module.exports = mongoose.model('Price', priceSchema)
