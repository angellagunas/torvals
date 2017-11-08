const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const moment = require('moment')

const apiSchema = new Schema({
  name: { type: String },
  baseUrl: { type: String },
  hostname: { type: String },
  apiToken: { type: String },
  username: { type: String },
  password: { type: String },
  dateCreated: { type: Date, default: moment.utc },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false }
})

module.exports = mongoose.model('Api', apiSchema)
