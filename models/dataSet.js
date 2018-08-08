const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')
const { aws } = require('../config')
const awsService = require('aws-sdk')
const fs = require('fs-extra')
const path = require('path')
const _ = require('lodash')
const sendEmail = require('tasks/emails/send-email')

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

  products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  newProducts: [{ type: Schema.Types.ObjectId, ref: 'CatalogItem' }],
  catalogItems: [{ type: Schema.Types.ObjectId, ref: 'CatalogItem' }],
  cycles: [{ type: Schema.Types.ObjectId, ref: 'Cycle' }],
  periods: [{ type: Schema.Types.ObjectId, ref: 'Period' }],

  channels: [{ type: Schema.Types.ObjectId, ref: 'Channel' }],
  salesCenters: [{ type: Schema.Types.ObjectId, ref: 'SalesCenter' }],

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
    products: this.products,
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
    products: this.products,
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
  const { CatalogItem, Product, Price } = require('models')

  if (!this.apiData) return

  await this.rule.populate('catalogs').execPopulate()

  this.products = []
  this.newProducts = []
  this.channels = []
  this.salesCenters = []
  this.catalogItems = []

  if (this.apiData.products) {
    for (let data of this.apiData.products) {
      let pos = this.products.findIndex(item => {
        return (
          String(item.externalId) === String(data._id) &&
          item.type === catalog.slug
        )
      })

      if (pos < 0) {
        let cItem = await Product.findOne({
          externalId: data._id,
          organization: this.organization._id
        })

        if (!cItem) {
          cItem = await Product.create({
            name: data['name'] ? data['name'] : 'Not identified',
            externalId: String(data._id),
            organization: this.organization,
            isNewExternal: true
          })
        } else if (cItem.isNewExternal && data['name']) {
          cItem.set({ name: data['name'] })
          await cItem.save()
        }

        cItem.set({isDeleted: false})
        await cItem.save()

        this.products.push(cItem)
      }
    }

    let catalog = this.rule.catalogs.find(item => { return item.slug === 'producto' })
    for (let data of this.apiData.products) {
      let pos = this.newProducts.findIndex(item => {
        return (
          String(item.externalId) === String(data._id) &&
          item.type === catalog.slug
        )
      })

      if (pos < 0) {
        let cItem = await CatalogItem.findOne({
          externalId: data._id,
          organization: this.organization._id,
          catalog: catalog._id
        })

        if (!cItem) {
          cItem = await CatalogItem.create({
            catalog: catalog._id,
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

        this.newProducts.push(cItem)

        let price = await Price.findOne({product: cItem._id})
        if (!price) {
          await Price.create({
            price: 0,
            product: cItem._id,
            organization: this.organization
          })
        }
      }
    }
  }

  for (let catalog of this.rule.catalogs) {
    if (this.apiData[catalog.slug]) {
      for (let data of this.apiData[catalog.slug]) {
        let pos = this.catalogItems.findIndex(item => {
          return (
            String(item.externalId) === String(data._id) &&
            item.type === catalog.slug
          )
        })

        if (pos < 0) {
          let cItem = await CatalogItem.findOne({
            externalId: data._id,
            organization: this.organization._id,
            catalog: catalog._id
          })

          if (!cItem) {
            cItem = await CatalogItem.create({
              catalog: catalog._id,
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
    catalogs[`is_${catalog.slug}_id`] = false
    catalogs[`is_${catalog.slug}_name`] = false
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

  const project = await Project.findOne({ '_id': this.project }).populate('organization')
  var previousDatasets = []
  // TODO: Refactor this.
  project.datasets.map(ds => {
    if (ds.dataset.toString() !== this._id.toString()) {
      previousDatasets.push(ds.dataset)
    }
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
  const recipients = {
    email: this.createdBy.email,
    name: this.createdBy.name
  }
  sendEmail.run({
    recipients,
    args: data,
    template: 'adjustment-finished',
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

module.exports = mongoose.model('DataSet', dataSetSchema)
