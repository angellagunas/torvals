const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')
const pick = require('lodash')

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

roleSchema.methods.toPublic = function () {
  const toPublic = [
    'uuid',
    'name',
    'description',
    'slug',
    'dateCreated',
    'priority'
  ]
  return pick.pick(this, toPublic)
}

roleSchema.methods.toAdmin = function () {
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

roleSchema.plugin(dataTables, {
  formatters: {
    toAdmin: (role) => role.toAdmin(),
    toPublic: (role) => role.toPublic()
  }
})

module.exports = mongoose.model('Role', roleSchema)
