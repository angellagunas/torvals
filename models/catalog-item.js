const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')

const catalogItemSchema = new Schema({
  type: { type: String },
  name: { type: String },
  externalId: { type: Number },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  isNewExternal: { type: Boolean, default: false },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false }
}, { usePushEach: true, timestamps: { updatedAt: 'dateUpdated', createdAt: 'dateCreated' } })

catalogItemSchema.plugin(dataTables)

catalogItemSchema.methods.toPublic = function () {
  return {
    uuid: this.uuid,
    dateCreated: this.dateCreated,
    week: this.week,
    month: this.month,
    year: this.year,
    externalId: this.externalId,
    dateStart: this.dateStart,
    dateEnd: this.dateEnd
  }
}

catalogItemSchema.methods.toAdmin = function () {
  return {
    uuid: this.uuid,
    dateCreated: this.dateCreated,
    week: this.week,
    month: this.month,
    year: this.year,
    externalId: this.externalId,
    dateStart: this.dateStart,
    dateEnd: this.dateEnd
  }
}

catalogItemSchema.index({ isDeleted: -1, uuid: 1, organization: 1 }, {background: true})
catalogItemSchema.index({ type: 1, organization: 1 }, {background: true})
catalogItemSchema.index({ type: 1, uuid: 1, organization: 1 }, {background: true})
catalogItemSchema.index({ type: 1, externalId: 1, organization: 1 }, {background: true})

module.exports = mongoose.model('CatalogItem', catalogItemSchema)
