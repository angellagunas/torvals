const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')

const roleSchema = new Schema({
  priority: { type: Number },
  name: { type: String },
  description: { type: String },
  slug: { type: String, unique: true },
  isDefault: { type: Boolean, default: false },

  dateCreated: { type: Date, default: moment.utc },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false }
}, { usePushEach: true })

roleSchema.plugin(dataTables)

roleSchema.methods.toPublic = function () {
  return {
    uuid: this.uuid,
    name: this.name,
    description: this.description,
    slug: this.slug,
    dateCreated: this.dateCreated,
    priority: this.priority
  }
}

roleSchema.methods.format = function () {
  return {
    uuid: this.uuid,
    priority: this.priority,
    name: this.name,
    description: this.description,
    slug: this.slug,
    dateCreated: this.dateCreated,
    isDefault: this.isDefault
  }
}

module.exports = mongoose.model('Role', roleSchema)
