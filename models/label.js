const moment = require('moment')
const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')

const labelSchema = new Schema({
  path: { type: String, required: true },
  key: { type: String, required: true },
  text: { type: String, required: true },

  dateCreated: { type: Date, default: moment.utc },
  isDeleted: { type: Boolean, default: false },
  uuid: { type: String, default: v4, unique: true }
}, { usePushEach: true })

labelSchema.methods.toAdmin = function () {
  return {
    path: this.path,
    key: this.key,
    text: this.text,
    uuid: this.uuid
  }
}

labelSchema.methods.toPublic = function () {
  return {
    path: this.path,
    key: this.key,
    text: this.text,
    uuid: this.uuid
  }
}

module.exports = mongoose.model('Label', labelSchema)
