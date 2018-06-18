const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')
const { aws } = require('../config')
const awsService = require('aws-sdk')
const fs = require('fs-extra')
const path = require('path')
const Mailer = require('lib/mailer')
const _ = require('lodash')

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
  conciliatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: ['univariable-time-series'],
    default: 'univariable-time-series'
  },

  dateMax: String,
  dateMin: String,
  error: String,
  etag: String,
  isMain: { type: Boolean, default: false },

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
      'conciliating',
      'conciliated',
      'pendingRows',
      'adjustment',
      'receiving',
      'cloning',
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
      'conciliation',
      'external'
    ],
    default: 'uploaded'
  },

  columns: [{ type: Schema.Types.Mixed }],

  groupings: [{
    column: { type: String },
    inputValue: { type: String },
    outputValue: { type: String }
  }],

  salesCenters: [{ type: Schema.Types.ObjectId, ref: 'SalesCenter' }],
  products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  channels: [{ type: Schema.Types.ObjectId, ref: 'Channel' }],
  catalogItems: [{ type: Schema.Types.ObjectId, ref: 'CatalogItem' }],
  cycles: [{ type: Schema.Types.ObjectId, ref: 'Cycle' }],
  periods: [{ type: Schema.Types.ObjectId, ref: 'Period' }],

  apiData: { type: Schema.Types.Mixed },
  dateCreated: { type: Date, default: moment.utc },
  dateConciliated: { type: Date, default: moment.utc },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false },
  uploaded: { type: Boolean, default: false },
  rule: {type: Schema.Types.ObjectId, ref: 'Rule'}
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
    error: this.error,
    url: this.url,
    uploaded: this.uploaded,
    source: this.source,
    fileChunk: this.fileChunk,
    project: this.project,
    columns: this.columns,
    groupings: this.groupings,
    dateMax: this.dateMax,
    dateMin: this.dateMin,
    isMain: this.isMain,
    salesCenters: this.salesCenters,
    products: this.products,
    channels: this.channels,
    rule: this.rule,
    catalogItems: this.catalogItems
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
    error: this.error,
    url: this.url,
    uploaded: this.uploaded,
    source: this.source,
    project: this.project,
    columns: this.columns,
    groupings: this.groupings,
    dateMax: this.dateMax,
    dateMin: this.dateMin,
    isMain: this.isMain,
    salesCenters: this.salesCenters,
    products: this.products,
    channels: this.channels,
    rule: this.rule,
    catalogItems: this.catalogItems
  }
}

dataSetSchema.methods.getDateColumn = function () {
  var obj = this.columns.find(item => { return item.isDate })

  return obj
}

dataSetSchema.methods.getAdjustmentColumn = function () {
  var obj = this.columns.find(item => { return item.isAdjustment })

  return obj
}

dataSetSchema.methods.getPredictionColumn = function () {
  var obj = this.columns.find(item => { return item.isPrediction })

  return obj
}

dataSetSchema.methods.getProductColumn = function () {
  var obj = this.columns.find(item => { return item.isProduct })

  return obj
}

dataSetSchema.methods.getProductNameColumn = function () {
  var obj = this.columns.find(item => { return item.isProductName })

  return obj
}

dataSetSchema.methods.getSalesCenterColumn = function () {
  var obj = this.columns.find(item => { return item.isSalesCenter })

  return obj
}

dataSetSchema.methods.getSalesCenterNameColumn = function () {
  var obj = this.columns.find(item => { return item.isSalesCenterName })

  return obj
}

dataSetSchema.methods.getChannelColumn = function () {
  var obj = this.columns.find(item => { return item.isChannel })

  return obj
}

dataSetSchema.methods.getChannelNameColumn = function () {
  var obj = this.columns.find(item => { return item.isChannelName })

  return obj
}

dataSetSchema.methods.getAnalysisColumn = function () {
  var obj = this.columns.find(item => { return item.isAnalysis })

  return obj
}

dataSetSchema.methods.getSalesColumn = function () {
  var obj = this.columns.find(item => { return item.isSales })

  return obj
}

dataSetSchema.methods.getCatalogItemColumn = function (type) {
  var obj = this.columns.find(item => { return item[type] })

  return obj
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
  if (!this.fileChunk.recreated) return false

  if (this.uploaded) return true

  let fileExtension = path.extname(this.fileChunk.filename)
  let fileName = `datasets/${this.uuid}/${v4()}${fileExtension}`
  let bucket = aws.s3Bucket
  let contentType = this.fileChunk.fileType
  let chunkKey = `datasets/${this.uuid}/`

  var s3File = {
    ContentType: 'text/csv',
    Bucket: bucket,
    ACL: 'public-read'
  }

  try {
    await this.fileChunk.uploadChunks(s3File, chunkKey)
  } catch (e) {
    this.fileChunk.lastChunk = 0
    this.fileChunk.recreated = false
    this.fileChunk.uploaded = false
    await this.fileChunk.save()

    return false
  }

  s3File['Body'] = await fs.readFile(path.join(this.fileChunk.path, this.fileChunk.filename))
  s3File['Key'] = fileName

  try {
    var s3 = new awsService.S3({
      credentials: {
        accessKeyId: aws.s3AccessKey,
        secretAccessKey: aws.s3Secret
      },
      region: aws.s3Region
    })

    await s3.putObject(s3File).promise()
  } catch (e) {
    return false
  }

  this.set({
    path: {
      url: fileName,
      bucket: bucket,
      region: aws.s3Region,
      savedToDisk: false
    },
    uploaded: true,
    status: 'configuring'
  })

  await this.save()

  return true
}

dataSetSchema.methods.processData = async function () {
  const { Product, SalesCenter, Channel, CatalogItem } = require('models')

  if (!this.apiData) return

  this.products = []
  this.channels = []
  this.salesCenters = []
  this.catalogItems = []

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
      } else if (product.isNewExternal) {
        product.set({name: p['name'] ? p['name'] : 'Not identified'})
        await product.save()
      }

      product.set({isDeleted: false})
      await product.save()
      var pos = this.products.findIndex(item => {
        return String(item.externalId) === String(product.externalId)
      })

      if (pos < 0) this.products.push(product)
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
      } else if (salesCenter.isNewExternal) {
        salesCenter.set({name: a['name'] ? a['name'] : 'Not identified'})
        await salesCenter.save()
      }

      salesCenter.set({isDeleted: false})
      await salesCenter.save()

      pos = this.salesCenters.findIndex(item => {
        return String(item.externalId) === String(salesCenter.externalId)
      })

      if (pos < 0) this.salesCenters.push(salesCenter)
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
      } else if (channel.isNewExternal) {
        channel.set({name: c['name'] ? c['name'] : 'Not identified'})
        await channel.save()
      }

      channel.set({isDeleted: false})
      await channel.save()

      pos = this.channels.findIndex(item => {
        return String(item.externalId) === String(channel.externalId)
      })

      if (pos < 0) this.channels.push(channel)
    }
  }

  await this.rule.populate('catalogs').execPopulate()
  for (let catalog of this.rule.catalogs) {
    if (this.apiData[catalog.slug]) {
      for (let data of this.apiData[catalog.slug]) {
        pos = this.catalogItems.findIndex(item => {
          return (
            String(item.externalId) === String(data._id) &&
            item.type === catalog.slug
          )
        })

        if (pos < 0) {
          let cItem = await CatalogItem.findOne({
            externalId: data._id,
            organization: this.organization._id,
            type: catalog.slug
          })

          if (!cItem) {
            cItem = await CatalogItem.create({
              name: data['name'] ? data['name'] : 'Not identified',
              externalId: String(data._id),
              organization: this.organization,
              isNewExternal: true,
              type: catalog.slug
            })
          } else if (cItem.isNewExternal && data['name']) {
            cItem.set({ name: data['name'] })
            await cItem.save()
          }

          cItem.set({isDeleted: false})
          await cItem.save()

          this.catalogItems.push(cItem)
        }
      }
    }
  }

  await this.save()
}

dataSetSchema.methods.processReady = async function (res) {
  let apiData = {
    ...res.data
  }

  this.set({
    dateMax: res.date_max,
    dateMin: res.date_min,
    apiData: apiData,
    groupings: res.config.groupings,
    cycles: res.cycles,
    periods: res.periods
  })

  await this.save()
  await this.processData()
}

dataSetSchema.methods.setColumns = async function (headers) {
  await this.populate('rule').execPopulate()
  await this.rule.populate('catalogs').execPopulate()

  let catalogs = {}
  for (let catalog of this.rule.catalogs) {
    catalogs[`is_${catalogs.slug}_id`] = false
    catalogs[`is_${catalogs.slug}_name`] = false
  }

  this.set({
    status: 'uploading',
    columns: headers.map(item => {
      return {
        name: item,
        isDate: false,
        isAnalysis: false,
        isAdjustment: false,
        isPrediction: false,
        isSales: false,
        isOperationFilter: false,
        isAnalysisFilter: false,
        isProduct: false,
        isProductName: false,
        isSalesCenter: false,
        isSalesCenterName: false,
        isChannel: false,
        isChannelName: false,
        ...catalogs
      }
    })
  })
  this.markModified('columns')

  await this.save()
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

dataSetSchema.methods.sendFinishedConciliating = async function () {
  const { Project, DataSet } = require('models')

  const email = new Mailer('adjustment-finished')
  const project = await Project.findOne({ '_id': this.project }).populate('organization')
  var previousDatasets = []
  project.datasets.map(ds => {
    if (ds.dataset.toString() !== this._id.toString()) { previousDatasets.push(ds.dataset) }
  })
  const lastDataset = await DataSet.findOne({
    _id: {$in: previousDatasets}
  }, {}, {sort: {dateCreated: -1}})

  if (this.source !== 'adjustment' || lastDataset.source !== 'adjustment' || lastDataset.status !== 'conciliated') { return }

  const subdomain = project.organization.slug
  var host = process.env.APP_HOST
  host = host.slice(0, host.indexOf('://') + 3) + subdomain + '.' + host.slice(host.indexOf('://') + 3)
  const data = {
    name: this.project.name,
    url: `${host}/projects/${project.uuid}`
  }

  await email.format(data)
  await email.send({
    recipient: {
      email: this.createdBy.email,
      name: this.createdBy.name
    },
    title: 'Ajustes conciliados'
  })
}

dataSetSchema.virtual('url').get(function () {
  if (this.path && this.path.savedToDisk) {
    return this.path.url
  }

  if (this.path && this.path.url) {
    return 'https://s3.' + this.path.region + '.amazonaws.com/' + this.path.bucket + '/' + this.path.url
  }

  return 'https://s3.us-west-2.amazonaws.com/pythia-kore-dev/avatars/default.jpg'
})

module.exports = mongoose.model('DataSet', dataSetSchema)
