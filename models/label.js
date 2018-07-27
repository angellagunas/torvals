const moment = require('moment')
const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')

const labelSchema = new Schema({
  organization: {type: Schema.Types.ObjectId, ref: 'Organization'},
  language: {type: Schema.Types.ObjectId, ref: 'Language', required: true},

  path: { type: String, required: true },
  key: { type: String, required: true },
  text: { type: String, required: true },

  dateCreated: { type: Date, default: moment.utc },
  isDeleted: { type: Boolean, default: false },
  uuid: { type: String, default: v4, unique: true }
}, { usePushEach: true })

labelSchema.methods.toAdmin = function () {
  return {
    organization: this.organization,
    language: this.language,
    path: this.path,
    key: this.key,
    text: this.text,
    uuid: this.uuid
  }
}

labelSchema.methods.toPublic = function () {
  return {
    organization: this.organization,
    language: this.language,
    path: this.path,
    key: this.key,
    text: this.text,
    uuid: this.uuid
  }
}

labelSchema.plugin(dataTables)

module.exports = mongoose.model('Label', labelSchema)
