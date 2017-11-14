const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')

const projectSchema = new Schema({
  name: { type: String },
  description: { type: String },

  dateCreated: { type: Date, default: moment.utc },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false }
})

projectSchema.plugin(dataTables)

module.exports = mongoose.model('Project', projectSchema)
