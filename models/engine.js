const moment = require('moment')
const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')

const userTokenSchema = new Schema({
  name: { type: String },
  description: { type: String },
  path: { type: String },
  instructions: { type: String },

  dateCreated: { type: Date, default: moment.utc },
  isDeleted: { type: Boolean },
  uuid: { type: String, default: v4 }
}, { usePushEach: true })

userTokenSchema.methods.toPrivate = function () {
  return {
    name: this.name,
    description: this.description,
    path: this.path,
    instructions: this.instructions,
    uuid: this.uuid
  }
}

userTokenSchema.methods.toPublic = function () {
  return {
    name: this.name,
    description: this.description,
    path: this.path,
    instructions: this.instructions,
    uuid: this.uuid
  }
}

module.exports = mongoose.model('Engine', engineSchema)
