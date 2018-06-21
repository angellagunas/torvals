const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')

const catalogSchema = new Schema({
  uuid: { type: String, default: v4 },
  name: { type: String },
  slug: { type: String },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  isDeleted: { type: Boolean, default: false }
}, { usePushEach: true, timestamps: { updatedAt: 'dateUpdated', createdAt: 'dateCreated' } })

catalogSchema.plugin(dataTables)

catalogSchema.methods.toPublic = function () {
  let data = {
    uuid: this.uuid,
    name: this.name,
    slug: this.name,
    groups: this.groups
  }

  if (this.organization) { data.organization = this.organization.toPublic() }

  return data
}

catalogSchema.methods.toAdmin = function () {
  let data = {
    uuid: this.uuid,
    name: this.name,
    slug: this.name,
    isDeleted: this.isDeleted,
    groups: this.groups
  }

  if (this.organization) { data.organization = this.organization.toPublic() }

  return data
}

catalogSchema.index({ isDeleted: -1, uuid: 1, organization: 1 }, {background: true})
catalogSchema.index({ slug: 1, organization: 1 }, {background: true})
catalogSchema.index({ slug: 1, uuid: 1, organization: 1 }, {background: true})

module.exports = mongoose.model('Catalog', catalogSchema)
