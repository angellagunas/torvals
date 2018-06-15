const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')

const salesCenterSchema = new Schema({
  name: { type: String, required: true },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  description: { type: String },
  address: { type: String },
  brand: { type: String },
  region: { type: String },
  type: { type: String },
  groups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
  externalId: { type: String },
  dateCreated: { type: Date, default: moment.utc },
  uuid: { type: String, default: v4 },
  isNewExternal: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }
}, { usePushEach: true })

salesCenterSchema.plugin(dataTables)

salesCenterSchema.methods.toPublic = function () {
  return {
    uuid: this.uuid,
    name: this.name,
    organization: this.organization.uuid,
    description: this.description,
    groups: this.groups,
    address: this.address,
    brand: this.brand,
    region: this.region,
    type: this.type,
    externalId: this.externalId,
    dateCreated: this.dateCreated
  }
}

salesCenterSchema.methods.toAdmin = function () {
  return {
    uuid: this.uuid,
    name: this.name,
    organization: this.organization.uuid,
    description: this.description,
    groups: this.groups,
    address: this.address,
    brand: this.brand,
    region: this.region,
    type: this.type,
    externalId: this.externalId,
    dateCreated: this.dateCreated
  }
}

// This is similar to the one in channel, maybe it can be joined...
salesCenterSchema.statics.filterByUserRole = async function (filters, role, user) {
  let channels = await this.find(filters).select({'_id': 1, 'groups': 1})

  if (
    role === 'manager-level-1' ||
    role === 'manager-level-2' ||
    role === 'manager-level-3' ||
    role === 'consultor-level-3' ||
    role === 'consultor-level-2'
  ) {
    channels = channels
      .filter(item => {
        let checkExistence = item.groups.some(function (e) {
          return user.groups.indexOf(String(e)) >= 0
        })
        return checkExistence
      })
      .map(item => { return item._id })
  } else {
    channels = channels.map(item => { return item._id })
  }
  return channels
}

module.exports = mongoose.model('SalesCenter', salesCenterSchema)
