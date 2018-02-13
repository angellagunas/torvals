const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')
const { aws } = require('../config')
const awsService = require('aws-sdk')
const fs = require('fs-extra')
const path = require('path')

const dataSetSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  path: {
    url: { type: String },
    bucket: { type: String },
    region: { type: String },
    savedToDisk: { type: Boolean, default: false }
  },
  externalId: { type: String },
  fileChunk: { type: Schema.Types.ObjectId, ref: 'FileChunk' },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: ['univariable-time-series'],
    default: 'univariable-time-series'
  },

  dateMax: String,
  dateMin: String,
  error: String,
  etag: String,

  status: {
    type: String,
    enum: [
      'new',
      'uploading',
      'uploaded',
      'preprocessing',
      'configuring',
      'processing',
      'reviewing',
      'ready',
      'conciliated',
      'pendingRows',
      'adjustment',
      'error'
    ],
    default: 'new'
  },

  source: {
    type: String,
    enum: [
      'uploaded',
      'forecast',
      'adjustment',
      'external'
    ],
    default: 'uploaded'
  },

  columns: [{
    name: { type: String },
    isDate: { type: Boolean, default: false },
    isAnalysis: { type: Boolean },
    isAdjustment: { type: Boolean },
    isPrediction: { type: Boolean },
    isOperationFilter: { type: Boolean, default: false },
    isAnalysisFilter: { type: Boolean, default: false },
    isProduct: { type: Boolean, default: false },
    isProductName: { type: Boolean, default: false },
    isSalesCenter: { type: Boolean, default: false },
    isSalesCenterName: { type: Boolean, default: false },
    isChannel: { type: Boolean, default: false },
    isChannelName: { type: Boolean, default: false },
    values: [{ type: String }]
  }],

  groupings: [{
    column: { type: String },
    inputValue: { type: String },
    outputValue: { type: String }
  }],

  salesCenters: [{ type: Schema.Types.ObjectId, ref: 'SalesCenter' }],
  newSalesCenters: [{ type: Schema.Types.ObjectId, ref: 'SalesCenter' }],
  products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  newProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  channels: [{ type: Schema.Types.ObjectId, ref: 'Channel' }],
  newChannels: [{ type: Schema.Types.ObjectId, ref: 'Channel' }],

  apiData: { type: Schema.Types.Mixed },
  dateCreated: { type: Date, default: moment.utc },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false },
  uploaded: { type: Boolean, default: false }
}, { usePushEach: true })

dataSetSchema.plugin(dataTables)

dataSetSchema.methods.toPublic = function () {
  return {
    uuid: this.uuid,
    name: this.name,
    description: this.description,
    dateCreated: this.dateCreated,
    createdBy: this.createdBy,
    uploadedBy: this.uploadedBy,
    organization: this.organization,
    status: this.status,
    url: this.url,
    uploaded: this.uploaded,
    source: this.source,
    fileChunk: this.fileChunk,
    project: this.project,
    columns: this.columns,
    groupings: this.groupings,
    dateMax: this.dateMax,
    dateMin: this.dateMin,
    newSalesCenters: this.newSalesCenters,
    newProducts: this.newProducts,
    newChannels: this.newChannels
  }
}

dataSetSchema.methods.format = function () {
  return {
    uuid: this.uuid,
    name: this.name,
    description: this.description,
    dateCreated: this.dateCreated,
    createdBy: this.createdBy,
    uploadedBy: this.uploadedBy,
    organization: this.organization,
    status: this.status,
    url: this.url,
    uploaded: this.uploaded,
    source: this.source,
    project: this.project,
    columns: this.columns,
    groupings: this.groupings,
    dateMax: this.dateMax,
    dateMin: this.dateMin,
    newSalesCenters: this.newSalesCenters,
    newProducts: this.newProducts,
    newChannels: this.newChannels
  }
}

dataSetSchema.methods.recreateAndSaveFileToDisk = async function () {
  await this.fileChunk.recreateFile()

  if (!this.fileChunk.recreated) return false

  this.set({
    path: {
      savedToDisk: true,
      url: path.join(this.fileChunk.path, this.fileChunk.filename)
    }
  })

  return true
}

dataSetSchema.methods.recreateAndUploadFile = async function () {
  await this.fileChunk.recreateFile()

  if (!this.fileChunk.recreated) return false

  if (this.uploaded) return true

  let fileExtension = path.extname(this.fileChunk.filename)
  let fileName = `datasets/${this.uuid}/${v4()}${fileExtension}`
  let bucket = aws.s3Bucket
  let contentType = this.fileChunk.fileType
  let chunkKey = `datasets/${this.uuid}/`

  var s3File = {
    ContentType: contentType,
    Bucket: bucket,
    ACL: 'public-read'
  }

  await this.fileChunk.uploadChunks(s3File, chunkKey)
  s3File['Body'] = await fs.readFile(path.join(this.fileChunk.path, this.fileChunk.filename))
  s3File['Key'] = fileName

  var s3 = new awsService.S3({
    credentials: {
      accessKeyId: aws.s3AccessKey,
      secretAccessKey: aws.s3Secret
    },
    region: aws.s3Region
  })

  await s3.putObject(s3File).promise()
  this.set({
    path: {
      url: fileName,
      bucket: bucket,
      region: aws.s3Region,
      savedToDisk: false
    },
    uploaded: true,
    status: 'preprocessing'
  })

  await this.save()

  return true
}

dataSetSchema.methods.processData = async function () {
  const { Product, SalesCenter, Channel } = require('models')

  if (!this.apiData) return

  this.products = []
  this.newProducts = []
  this.channels = []
  this.salesCenters = []
  this.newSalesCenters = []
  this.newChannels = []

  if (this.apiData.products) {
    for (var p of this.apiData.products) {
      var product = await Product.findOne({
        externalId: p._id,
        organization: this.organization
      })

      if (!product) {
        product = await Product.create({
          name: p['name'] ? p['name'] : 'Not identified',
          externalId: p._id,
          organization: this.organization,
          isNewExternal: true
        })

        this.newProducts.push(product)
      } else if (product.isNewExternal) {
        product.set({name: p['name'] ? p['name'] : 'Not identified'})
        await product.save()

        var posNew = this.newProducts.findIndex(item => {
          return String(item.externalId) === String(product.externalId)
        })
        if (posNew < 0) {
          this.newProducts.push(product)
        }
      } else {
        product.set({isDeleted: false})
        await product.save()
        var pos = this.products.findIndex(item => {
          return String(item.externalId) === String(product.externalId)
        })

        posNew = this.newProducts.findIndex(item => {
          return String(item.externalId) === String(product.externalId)
        })

        if (pos < 0 && posNew < 0) this.products.push(product)
      }
    }
  }

  if (this.apiData.salesCenters) {
    for (var a of this.apiData.salesCenters) {
      var salesCenter = await SalesCenter.findOne({
        externalId: a._id,
        organization: this.organization
      })

      if (!salesCenter) {
        salesCenter = await SalesCenter.create({
          name: a['name'] ? a['name'] : 'Not identified',
          externalId: a._id,
          organization: this.organization,
          isNewExternal: true
        })

        this.newSalesCenters.push(salesCenter)
      } else if (salesCenter.isNewExternal) {
        salesCenter.set({name: a['name'] ? a['name'] : 'Not identified'})
        await salesCenter.save()
        posNew = this.newSalesCenters.findIndex(item => {
          return String(item.externalId) === String(salesCenter.externalId)
        })
        if (posNew < 0) {
          this.newSalesCenters.push(salesCenter)
        }
      } else {
        salesCenter.set({isDeleted: false})
        await salesCenter.save()
        pos = this.salesCenters.findIndex(item => {
          return String(item.externalId) === String(salesCenter.externalId)
        })

        posNew = this.newSalesCenters.findIndex(item => {
          return String(item.externalId) === String(salesCenter.externalId)
        })

        if (pos < 0 && posNew < 0) this.salesCenters.push(salesCenter)
      }
    }
  }

  if (this.apiData.channels) {
    for (var c of this.apiData.channels) {
      var channel = await Channel.findOne({
        externalId: c._id,
        organization: this.organization
      })

      if (!channel) {
        channel = await Channel.create({
          name: c['name'] ? c['name'] : 'Not identified',
          externalId: c._id,
          organization: this.organization,
          isNewExternal: true
        })

        posNew = this.newChannels.findIndex(item => {
          return String(item.externalId) === String(channel.externalId)
        })

        if (posNew < 0) {
          this.newChannels.push(channel)
        }
      } else if (channel.isNewExternal) {
        channel.set({name: c['name'] ? c['name'] : 'Not identified'})
        await channel.save()
        this.newChannels.push(channel)
      } else {
        channel.set({isDeleted: false})
        await channel.save()

        pos = this.channels.findIndex(item => {
          return String(item.externalId) === String(channel.externalId)
        })

        posNew = this.newChannels.findIndex(item => {
          return String(item.externalId) === String(channel.externalId)
        })

        if (pos < 0 && posNew < 0) this.channels.push(channel)
      }
    }
  }

  this.markModified(
    'products', 'newProducts',
    'salesCenters', 'newSalesCenters',
    'channels', 'newChannels')

  await this.save()
}

dataSetSchema.methods.processReady = async function (res) {
  if (res.status === 'error') {
    this.set({
      error: res.message,
      status: 'error'
    })

    await this.save()
    return
  }

  let apiData = {
    products: [],
    salesCenters: [],
    channels: []
  }

  apiData['products'] = res.data['product']
  apiData['salesCenters'] = res.data['agency']
  apiData['channels'] = res.data['channel']

  this.set({
    columns: res.headers.map(item => {
      var isDate = false
      var isAnalysis = false
      var isOperationFilter = false
      var isAnalysisFilter = false
      var isProductName = false
      var isProduct = false
      var isSalesCenterName = false
      var isSalesCenter = false
      var isChannel = false
      var isChannelName = false

      if (res.columns['is_date'] === item) {
        isDate = true
      }

      if (res.columns['is_analysis'] === item) {
        isAnalysis = true
      }

      if (res.columns['filter_operations'].find(col => { return col === item })) {
        isOperationFilter = true
      }

      var product = res.columns.filter_analysis.find(col => {
        return col.product || false
      })

      if (product) {
        product = product.product
        if (product._id === item) {
          isProduct = true
        }

        if (product.name && product.name === item) {
          isProductName = true
        }
      }

      var salesCenter = res.columns.filter_analysis.find(col => {
        return col.agency || false
      })

      if (salesCenter) {
        salesCenter = salesCenter.agency
        if (salesCenter._id === item) {
          isSalesCenter = true
        }

        if (salesCenter.name && salesCenter.name === item) {
          isSalesCenterName = true
        }
      }

      var channel = res.columns.filter_analysis.find(col => {
        return col.channel || false
      })

      if (channel) {
        channel = channel.channel
        if (channel._id === item) {
          isChannel = true
        }

        if (channel.name && channel.name === item) {
          isChannelName = true
        }
      }

      return {
        name: item,
        isDate: isDate,
        isAnalysis: isAnalysis,
        isOperationFilter: isOperationFilter,
        isAnalysisFilter: isAnalysisFilter,
        isProduct: isProduct,
        isProductName: isProductName,
        isSalesCenter: isSalesCenter,
        isSalesCenterName: isSalesCenterName,
        isChannel: isChannel,
        isChannelName: isChannelName
      }
    }),
    dateMax: res.date_max,
    dateMin: res.date_min,
    apiData: apiData,
    groupings: res.columns.groupings
  })

  await this.save()
  await this.processData()
}

dataSetSchema.methods.process = async function (res) {
  if (res.status === 'error') {
    this.set({
      error: res.message,
      status: 'error'
    })

    await this.save()
    return
  }

  this.set({
    status: 'preprocessing'
  })

  if (res.status === 'uploading' || !res.headers) {
    await this.save()
    return
  }

  this.set({
    status: 'configuring',
    columns: res.headers.map(item => {
      return {
        name: item,
        isDate: false,
        isAnalysis: false,
        isOperationFilter: false,
        isAnalysisFilter: false
      }
    })
  })

  if (res.status === 'done') {
    await this.save()
    return
  }

  this.set({
    status: 'processing'
  })

  if (res.status === 'processing') {
    await this.save()
    return
  }

  await this.processReady(res)

  if (res.status === 'ready') {
    this.set({status: 'ready'})
    await this.save()
    await this.processData()
    return
  }

  this.set({
    status: 'conciliated'
  })

  await this.save()
  await this.processData()
}

dataSetSchema.virtual('url').get(function () {
  if (this.path && this.path.savedToDisk) {
    return this.path.url
  }

  if (this.path && this.path.url) {
    return 'https://s3-' + this.path.region + '.amazonaws.com/' + this.path.bucket + '/' + this.path.url
  }

  return 'https://s3-us-west-2.amazonaws.com/pythia-kore-dev/avatars/default.jpg'
})

module.exports = mongoose.model('DataSet', dataSetSchema)
