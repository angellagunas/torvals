const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')

const catalogItemSchema = new Schema({
  type: { type: String },
  name: { type: String },
  externalId: { type: String },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  isNewExternal: { type: Boolean, default: false },
  uuid: { type: String, default: v4 },
  groups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
  isDeleted: { type: Boolean, default: false }
}, { usePushEach: true, timestamps: { updatedAt: 'dateUpdated', createdAt: 'dateCreated' } })

catalogItemSchema.plugin(dataTables)

catalogItemSchema.methods.toPublic = function () {
  let data = {
    uuid: this.uuid,
    type: this.type,
    name: this.name,
    externalId: this.externalId,
    isNewExternal: this.isNewExternal,
    groups: this.groups
  }

  if (this.organization) { data.organization = this.organization.toPublic() }

  return data
}

catalogItemSchema.methods.toAdmin = function () {
  let data = {
    uuid: this.uuid,
    type: this.type,
    name: this.name,
    externalId: this.externalId,
    isNewExternal: this.isNewExternal,
    isDeleted: this.isDeleted,
    groups: this.groups
  }

  if (this.organization) { data.organization = this.organization.toPublic() }

  return data
}

catalogItemSchema.index({ isDeleted: -1, uuid: 1, organization: 1 }, {background: true})
catalogItemSchema.index({ type: 1, organization: 1 }, {background: true})
catalogItemSchema.index({ type: 1, uuid: 1, organization: 1 }, {background: true})
catalogItemSchema.index({ type: 1, externalId: 1, organization: 1 }, {background: true})

module.exports = mongoose.model('CatalogItem', catalogItemSchema)
