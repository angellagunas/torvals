const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')

const dataSetSchema = new Schema({
  name: { type: String },
  description: { type: String },
  path: { type: String },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  type: { type: String,
    enum : ['univariable-time-series'],
    default: 'univariable-time-series' },

  status: { type: String,
    enum : ['new','uploading','preprocessing','configuring','processing','reviewing','ready'],
    default: 'new' },

  columns: [{
    isDate: { type: Boolean, default: false },
    analyze: { type: String },
    isOperationFilter: { type: Boolean, default: false },
    isAnalysisFilter: { type: Boolean, default: false },
    distinctValues: { type: String }
  }],

  groupings: [{
    column: { type: String },
    inputValue: { type: String },
    outputValue: { type: String }
  }],

  dateCreated: { type: Date, default: moment.utc },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false }
})

dataSetSchema.plugin(dataTables)

module.exports = mongoose.model('DataSet', dataSetSchema)
