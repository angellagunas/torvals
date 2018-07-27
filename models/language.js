const moment = require('moment')
const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')

const languageSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },

  dateCreated: { type: Date, default: moment.utc },
  isDeleted: { type: Boolean, default: false },
  uuid: { type: String, default: v4, unique: true }
}, { usePushEach: true })

languageSchema.methods.toAdmin = function () {
  return {
    name: this.name,
    code: this.code,
    uuid: this.uuid
  }
}

languageSchema.methods.toPublic = function () {
  return {
    name: this.name,
    code: this.code,
    uuid: this.uuid
  }
}

languageSchema.plugin(dataTables)

module.exports = mongoose.model('Language', languageSchema)
