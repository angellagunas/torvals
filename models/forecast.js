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
  error: { type: String },
  configPrId: { type: String },
  forecastId: { type: String },
  dateStart: { type: Date },
  dateEnd: { type: Date },
  holidays: [{
    name: { type: String },
    date: { type: Date }
  }],
  frequency: { type: String, enum: ['B', 'D', 'W', 'M'] },
  status: {
    type: String,
    enum: [
      'created',
      'processing',
      'done',
      'analistReview',
      'opsReview',
      'supervisorReview',
      'readyToOrder',
      'error'
    ],
    default: 'created'
  },
  changePoints: [{ type: Date }],
  columnsForForecast: [{ type: String }],

  salesCenters: [{ type: Schema.Types.ObjectId, ref: 'SalesCenter' }],
  newSalesCenters: [{ type: Schema.Types.ObjectId, ref: 'SalesCenter' }],
  products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  newProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  graphData: { type: Schema.Types.Mixed },

  dateCreated: { type: Date, default: moment.utc },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false }
}, { usePushEach: true })

forecastSchema.plugin(dataTables)

forecastSchema.methods.toPublic = function () {
  return {
    uuid: this.uuid,
    dateCreated: this.dateCreated,
    createdBy: this.createdBy,
    organization: this.organization,
    dateStart: this.dateStart,
    dateEnd: this.dateEnd,
    holidays: this.holidays,
    changePoints: this.changePoints,
    frequency: this.frequency,
    project: this.project,
    graphData: this.graphData,
    status: this.status,
    error: this.error
  }
}

forecastSchema.methods.format = function () {
  return {
    uuid: this.uuid,
    dateCreated: this.dateCreated,
    createdBy: this.createdBy,
    organization: this.organization,
    dateStart: this.dateStart,
    dateEnd: this.dateEnd,
    holidays: this.holidays,
    changePoints: this.changePoints,
    frequency: this.frequency,
    project: this.project,
    graphData: this.graphData,
    status: this.status,
    error: this.error
  }
}

forecastSchema.methods.addProducts = async function (products) {
  const {Product} = require('models')
  for (var product of products) {
    const productVerify = await Product.findOne({_id: product._id})
    const posProduct = this.products.indexOf(product._id)

    if (productVerify.name && posProduct < 0) {
      this.products.push(productVerify._id)
    } else if (!productVerify) {
      const newProduct = await Product.create(product)
      this.newProducts.push(newProduct._id)
    } else {
      return false
    }
  }
  this.save()

  return true
}

forecastSchema.methods.addSalesCenters = async function (salesCenters) {
  const {SalesCenter} = require('models')
  for (var salesCenter of salesCenters) {
    const salesCenterVerify = await SalesCenter.findOne({_id: salesCenter._id})
    const posSalesCenter = this.salesCenters.indexOf(salesCenter._id)

    if (salesCenterVerify.name && posSalesCenter < 0) {
      this.salesCenters.push(salesCenterVerify._id)
    } else if (!salesCenterVerify) {
      const newSalesCenter = await SalesCenter.create(salesCenter)
      this.newSalesCenters.push(newSalesCenter._id)
    } else {
      return false
    }
  }
  this.save()

  return true
}

module.exports = mongoose.model('Forecast', forecastSchema)
