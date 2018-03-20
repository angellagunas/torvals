const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')

const productSchema = new Schema({
  name: { type: String, required: true },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  price: { type: Schema.Types.ObjectId, ref: 'Price', required: false },
  description: { type: String },
  type: { type: String },
  category: { type: String },
  subcategory: { type: String },
  externalId: { type: String },
  dateCreated: { type: Date, default: moment.utc },
  uuid: { type: String, default: v4 },
  isNewExternal: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }
}, { usePushEach: true })

productSchema.plugin(dataTables)

productSchema.methods.format = function () {
  return {
    uuid: this.uuid,
    name: this.name,
    organization: this.organization.uuid,
    description: this.description,
    category: this.category,
    subcategory: this.subcategory,
    externalId: this.externalId,
    price: this.price,
    dateCreated: this.dateCreated
  }
}

module.exports = mongoose.model('Product', productSchema)
