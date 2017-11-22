const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')

// config_pr on Abraxas API
const forecastSchema = new Schema({
  datasets: [{ type: Schema.Types.ObjectId, ref: 'DataSet' }],
  organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  confirmedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  externalId: { type: String },
  dateStart: { type: Date },
  dateEnd: { type: Date },
  holidays: [{
    name: { type: String },
    date: { type: Date }
  }],
  frequency: { type: String, enum: ['B', 'D', 'W', 'M'] },
  status: {
    type: String,
    enum: ['created', 'processing', 'ready'],
    default: 'created'
  },
  changePoints: [{ type: Date }],

  salesCenters: [{ type: Schema.Types.ObjectId, ref: 'SalesCenter' }],
  newSalesCenters: [{ type: Schema.Types.ObjectId, ref: 'SalesCenter' }],
  products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  newProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],

  dateCreated: { type: Date, default: moment.utc },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false }
})

forecastSchema.plugin(dataTables)

forecastSchema.methods.toPublic = function () {
  return {
    uuid: this.uuid,
    dateCreated: this.dateCreated,
    createdBy: this.createdBy,
    organization: this.organization,
    status: this.status
  }
}

forecastSchema.methods.format = function () {
  return {
    uuid: this.uuid,
    dateCreated: this.dateCreated,
    createdBy: this.createdBy,
    organization: this.organization,
    status: this.status
  }
}

module.exports = mongoose.model('Forecast', forecastSchema)
