const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')

const predictionHistoricSchema = new Schema({
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  lastAdjustment: { type: Number },
  newAdjustment: { type: Number },
  prediction: { type: Number },
  predictionObj: { type: Schema.Types.ObjectId, ref: 'Prediction' },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization' },

  uuid: { type: String, default: v4 }
}, {
  timestamps: true
})

predictionHistoricSchema.plugin(dataTables)

module.exports = mongoose.model('PredictionHistoric', predictionHistoricSchema)
