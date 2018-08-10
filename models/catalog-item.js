const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')

const catalogItemSchema = new Schema({
  catalog: { type: Schema.Types.ObjectId, ref: 'Catalog', required: true },
  relatedTo: [{ type: Schema.Types.ObjectId, ref: 'CatalogItem' }],
  organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String },
  type: { type: String },
  externalId: { type: String },
  isNewExternal: { type: Boolean, default: false },
  uuid: { type: String, default: v4 },
  groups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
  isDeleted: { type: Boolean, default: false }
}, {
  usePushEach: true,
  timestamps: { updatedAt: 'dateUpdated', createdAt: 'dateCreated' }
})

catalogItemSchema.plugin(dataTables)

catalogItemSchema.methods.toPublic = function () {
  let data = {
    uuid: this.uuid,
    name: this.name,
    type: this.type,
    externalId: this.externalId,
    isNewExternal: this.isNewExternal,
    groups: this.groups
  }

  if (this.organization.uuid) { data.organization = this.organization.toPublic() }

  return data
}

catalogItemSchema.methods.toAdmin = function () {
  let data = {
    uuid: this.uuid,
    name: this.name,
    type: this.type,
    externalId: this.externalId,
    isNewExternal: this.isNewExternal,
    isDeleted: this.isDeleted,
    groups: this.groups
  }

  if (this.organization.uuid) { data.organization = this.organization.toPublic() }

  return data
}

catalogItemSchema.index({ isDeleted: -1, uuid: 1, organization: 1 }, {background: true})
catalogItemSchema.index({ catalog: 1, organization: 1 }, {background: true})
catalogItemSchema.index({ catalog: 1, uuid: 1, organization: 1 }, {background: true})
catalogItemSchema.index({ catalog: 1, externalId: 1, organization: 1 }, {background: true})

catalogItemSchema.statics.filterByUserRole = async function (filters, role, user) {
  let items = await this.find(filters).select({'_id': 1, 'groups': 1})

  const permissions = [
    'manager-level-1' ,
    'manager-level-2',
    'manager-level-3',
    'consultor-level-2' ,
    'consultor-level-3' 
  ]
  if (permissions.includes(role)) {
    items = items
      .filter(item => {
        let checkExistence = item.groups.some(function (e) {
          return user.groups.indexOf(String(e)) >= 0
        })
        return checkExistence
      })
      .map(item => { return item._id })
  } else {
    items = items.map(item => { return item._id })
  }
  return items
}

module.exports = mongoose.model('CatalogItem', catalogItemSchema)
