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
  groups: [{ type: Schema.Types.ObjectId, ref: 'Group'}],
  externalId: { type: String },

  dateCreated: { type: Date, default: moment.utc },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false }
})

salesCenterSchema.plugin(dataTables)

module.exports = mongoose.model('SalesCenter', salesCenterSchema)
