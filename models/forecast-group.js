const moment = require('moment')
const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')

const forecastGroupSchema = new Schema({
  project: { type: Schema.Types.ObjectId, ref: 'Project' },
  forecasts: [{ type: Schema.Types.ObjectId, ref: 'Project' }],

  alias: { type: String },
  type: {
    type: String,
    enum: [
      'informative',
      'compatible'
    ],
    default: 'created'
  },

  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  dateCreated: { type: Date, default: moment.utc },
  isDeleted: { type: Boolean },
  uuid: { type: String, default: v4 }
}, { usePushEach: true })

forecastGroupSchema.methods.toPrivate = function () {
  return {
    project: this.project,
    forecasts: this.forecasts,
    alias: this.alias,
    type: this.type,
    uuid: this.uuid
  }
}

forecastGroupSchema.methods.toPublic = function () {
  return {
    project: this.project,
    forecasts: this.forecasts,
    alias: this.alias,
    type: this.type,
    uuid: this.uuid
  }
}

module.exports = mongoose.model('ForecastGroup', forecastGroupSchema)
