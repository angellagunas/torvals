const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')

const requestLogSchema = new Schema({
  headers: { type: Object },
  query: { type: String },
  host: { type: String },
  path: { type: String },
  body: { type: Object },
  ip: { type: String },
  method: { type: String },
  status: { type: Number },
  uuid: { type: String, default: v4 },
  error: {
    message: { type: String },
    stack: { type: String }
  },
  response: { type: Schema.Types.Mixed }
}, {
  timestamps: true
})

requestLogSchema.plugin(dataTables)

module.exports = mongoose.model('RequestLog', requestLogSchema)
