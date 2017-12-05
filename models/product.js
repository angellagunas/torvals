const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')

const productSchema = new Schema({
  name: { type: String, required: true },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  description: { type: String },
  type: { type: String },
  category: { type: String },
  subcategory: { type: String },
  cost: { type: Number },
  externalId: { type: String },

  dateCreated: { type: Date, default: moment.utc },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false }
})

productSchema.plugin(dataTables)

productSchema.methods.format = function () {
  return {
    uuid: this.uuid,
    name: this.name,
    organization: this.organization.uuid,
    description: this.description,
    cost: this.cost,
    dateCreated: this.dateCreated
  }
}

module.exports = mongoose.model('Product', productSchema)
