const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const moment = require('moment')

const noteSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
  text: { type: String },
  dateCreated: { type: Date, default: moment.utc },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false },
  source: {type: String, default: 'note'}
})

noteSchema.methods.format = function () {
  return {
    uuid: this.uuid,
    user: this.user,
    order: this.order,
    text: this.text,
    dateCreated: this.dateCreated,
    isDeleted: this.isDeleted
  }
}

noteSchema.methods.toAdmin = function () {
  const data = {
    uuid: this.uuid,
    user: this.user,
    order: this.order,
    text: this.text,
    dateCreated: this.dateCreated,
    isDeleted: this.isDeleted
  }

  return data
}

module.exports = mongoose.model('Note', noteSchema)
