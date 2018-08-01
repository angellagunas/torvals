const moment = require('moment')
const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')

const alertSchema = new Schema({
  name: { type: String },
  slug: { type: String },
  type: { type: String,
    enum: [
      'email',
      'push'
    ],
    default: 'inactive'
  },
  description: { type: String },
  status: { type: String,
    enum: [
      'active',
      'inactive'
    ],
    default: 'inactive'
  },
  default: { type: Boolean, default: true },
  template: { type: String },
  roles: [{ type: Schema.Types.ObjectId, ref: 'Role' }],

  dateCreated: { type: Date, default: moment.utc },
  isDeleted: { type: Boolean, default: false },
  uuid: { type: String, default: v4, unique: true }
}, { usePushEach: true })

alertSchema.methods.toAdmin = function () {
  return {
    name: this.name,
    type: this.type,
    description: this.description,
    status: this.status,
    default: this.default,
    template: this.template,
    roles: this.roles,

    dateCreated: this.dateCreated,
    isDeleted: this.isDeleted,
    uuid: this.uuid
  }
}

alertSchema.methods.toPublic = function () {
  return {
    name: this.name,
    type: this.type,
    description: this.description,
    status: this.status,
    default: this.default,
    template: this.template,
    roles: this.roles,

    dateCreated: this.dateCreated,
    isDeleted: this.isDeleted,
    uuid: this.uuid
  }
}

alertSchema.plugin(dataTables)

module.exports = mongoose.model('Alert', alertSchema)
