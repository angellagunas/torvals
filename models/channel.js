const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')

const channelSchema = new Schema({
  name: { type: String },
  externalId: { type: String },
  uuid: { type: String, default: v4 },
  dateCreated: { type: Date, default: moment.utc },
  isDeleted: { type: Boolean, default: false },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  isNewExternal: { type: Boolean, default: false }
})

channelSchema.plugin(dataTables)

channelSchema.methods.toPublic = function () {
  return {
    uuid: this.uuid,
    name: this.name,
    externalId: this.externalId,
    dateCreated: this.dateCreated,
    organization: this.organization
  }
}

module.exports = mongoose.model('Channel', channelSchema)
