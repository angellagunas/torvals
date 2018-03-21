const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const moment = require('moment')

const tokenSchema = new Schema({
  token: {type: String},
  expires: { type: Date, default: moment.add(1, 'hours').utc },
  createdAt: { type: Date, default: moment.utc }

})

module.exports = mongoose.model('Token', tokenSchema)
